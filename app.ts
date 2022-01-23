import { ApiPromise, WsProvider } from '@polkadot/api';
import { Settings } from './Settings';
import { Messaging } from './Messaging';
import { MonitoredData } from './MonitoredData';
import { encodeAddress } from '@polkadot/util-crypto';
import { Utility } from "./Utility";
import { ChainData } from './ChainData';
import { Nomination, PendingNomination } from './Types';


/*
  Monitors for a proxy(announce) event, if it occurs then display a message
*/
async function monitorProxyAnnoucements() {

  let monitor = MonitoredData.getInstance();
  let chain_data = ChainData.getInstance();

  const prefix = chain_data.getPrefix();

  //In the unlikely event that API is undefined then exit by return;
  const api = chain_data.getApi();
  if (api == undefined) {
    return;
  }

  executeProxyChanges();

  Messaging.sendMessage('Waiting for proxy event..');

  api.query.system.events((events) => {

    events.forEach((record) => {
      // Extract the phase, event and the event types
      const { event } = record;
      // If the event is a proxy(annouce)
      if (api.events.proxy.Announced.is(event)) {
        //Get the public key from data[0] and then convert to the chain address
        const nominator_account = encodeAddress(event.data[0], prefix);

        //If the nominator_account is one of the 1KV nominator accounts then
        if (Settings.tvp_nominators.find(nominator => nominator.controller == nominator_account)) {
          executeProxyChanges();
        }
      }

    });
  });

}

async function executeProxyChanges() {
  let monitor = MonitoredData.getInstance();
  let chain_data = ChainData.getInstance();
  Utility.tvp_candidates = await Utility.getCandidates();


  //In the unlikely event that API is undefined then exit by return;
  const api = chain_data.getApi();
  if (api == undefined) {
    return;
  }

  Messaging.sendMessage('Loading possible proxy assignments..');
  //Preloads possible candidates
  Settings.tvp_nominators.forEach(nominator_account => {
    Utility.getProxyNominees(nominator_account.controller).then(proxy_data => {
      monitor.addProxyCall({
        nominator: nominator_account.controller,
        proxy_info: proxy_data
      });
    });
  });
}

/*
  Monitors for a session change event, if the session changes is also and era change
  then display current nominations, strikingthrough any who are no longer nominated,
  also increment number of eras that each retained validator is nominating for.
*/
async function monitorEraChange() {

  Messaging.sendMessage('Loading current nominations..');
  let chain_data = ChainData.getInstance();

  //In the unlikely event that API is undefined then return;
  const api = chain_data.getApi();
  if (api == undefined) {
    return;
  }

  executeEraChange();
  //Start monitoring new session events

  Messaging.sendMessage('Waiting for new session event..');

  api.query.system.events((events) => {

    events.forEach((record) => {
      // Extract the phase, event and the event types
      const { event } = record;
      // If the event is a new session event then
      if (api.events.session.NewSession.is(event)) {

        //retrieve the session
        const current_session = (parseInt(event.data[0].toString()) % 6) + 1;

        if (current_session == 1) {
          executeEraChange();
        }

      }

    });
  });
}

async function executeEraChange() {
  Utility.tvp_candidates = await Utility.getCandidates();
  const nominators = await Utility.getNominators();
  const nominator_map = await Utility.getNominatorMap();

  let chain_data = ChainData.getInstance();
  let monitor = MonitoredData.getInstance();

  //Preload nominations on startup
  monitor.setEra(await chain_data.getCurrentEra());
  //Add to the nominations which will also send a message
  await Messaging.sendMessage(`___`);
  await Messaging.sendMessage(`Loading nomination data for era <b>${await chain_data.getCurrentEra()}<b>...`);
  for (var nom_index = 0; nom_index < nominators.length; nom_index++) {
    const nomination_data = await Utility.getValidatorNominations(nominators[nom_index].stash, nominator_map);

    //Wait 2ms to prevent flooding
    await new Promise(f => setTimeout(f, 2000));
    //Updates the previous nomination count for each nominee
    updateNominationData(nomination_data).then(u_nomination_data => {
      monitor.addNomination(u_nomination_data);
    });

  }

  produceNominationSummary(nominator_map);

}

async function produceNominationSummary(nomination_map: [string, string[]][]) {
  var output: string[] = [];
  var total_nominations:number=0;
  var validator_map: { val: string, nom: string[] }[] = [];
  let chain_data = ChainData.getInstance();

  var current_era = await chain_data.getCurrentEra();

  var voters = Utility.tvp_candidates.filter(cand => cand.democracyVoteCount > 0);

  //Inverts the nominator map, allowing validators to be exposed
  for (let [nominator, validators] of nomination_map) {
    total_nominations += validators.length;

    validators.forEach(validator => {
      var found_val_index = validator_map.findIndex(x => x.val == validator);
      if (found_val_index > -1) {
        validator_map[found_val_index].nom.push(nominator);
      } else {
        validator_map.push({ val: validator, nom: [nominator] })
      }
    });
  }

  //Get a list of all voters that are nominated
  var nominated_voters = voters.filter(voter => validator_map.map(x => x.val).indexOf(voter.stash) > -1);
  var nominated_voters_percent = ((nominated_voters.length * 100.0) / voters.length).toFixed(2);

  var val_scores = validator_map.map(x => x.val).sort((a, b) => Utility.getScore(Utility.tvp_candidates, a) - Utility.getScore(Utility.tvp_candidates, b));

  output.push(`<p> In era ${current_era} there were ${nomination_map.length} nominators that nominated ${validator_map.length} unique validators. `);
  output.push(`Out of the ${voters.length} validators who participated in democracy voting, ${nominated_voters_percent}% (${nominated_voters.length}) are presently nominated.  `);
  output.push(`Validators scores ranged from ${Utility.getScore(Utility.tvp_candidates, val_scores[0]).toFixed(2)} to ${Utility.getScore(Utility.tvp_candidates, val_scores[val_scores.length - 1]).toFixed(2)}.</p>`);
  //console.log(validator_map);
  validator_map = validator_map.filter(val => val.nom.length > 1);
  //console.log(`XXXX`);

  //Displays validators with duplicated nominations
  if (validator_map.length > 0) {
    output.push(`There are also ${validator_map.length} validator(s) who are nominated by two or more nominators.  `);
    output.push(`<details>`);
    output.push(`<summary>Click here for details</summary>`)
    validator_map.forEach(val => {
      output.push(`${Utility.getName(Utility.tvp_candidates, val.val)}`);
      output.push(`<ul>`);
      val.nom.forEach(nom => {
        output.push(`<li>${nom}</li>`);
      });
      output.push(`</ul>`);
    });
    output.push(`</details>`);
  }

  //Issues a delay for the summary so that it displays last.
  setTimeout(() => {
    Messaging.sendMessage(output.join(""));
  }, 4000);

}

/* 
  This will be used to populate correct 'previous' nomination counts for nominees on first load
  of the bot, for now do nothing.

  TODO: Read chain data to populate previous nominations
*/
async function updateNominationData(nominationData: Nomination): Promise<Nomination> {
  /*var previous_nominations = await Utility.getPreviousNominations();
  previous_nominations = previous_nominations.filter(item=>item.address==nominationData.nominator);

  var result:Nomination = {
    nominator:nominationData.nominator,
    era:nominationData.era,
    nominees:[]
  }*/
  return nominationData;
}

/*
    The following method monitors block numbers, if the block number is at the anticipated block number
    of a proxy call, then send a message to expect a change in the next era.

    In the future this would be expanded to anticipate proxy(announce) calls, if it isn't retrieved in
    24+lag hours then send a message that something might be wrong.
*/
async function monitorProxyChanges() {
  let monitor = MonitoredData.getInstance();
  let chain_data = ChainData.getInstance();

  const api = chain_data.getApi();
  if (api == undefined) {
    return;
  }

  await api.rpc.chain.subscribeNewHeads((header) => {

    var block_number: number = parseInt(header.number.unwrap().toString());
    var proxy_data = monitor.hasProxyCall(block_number);

    if (proxy_data != undefined) {

      var tvp_nominator = Settings.tvp_nominators.find(nominator => nominator.controller == proxy_data!.nominator);
      var stash = tvp_nominator != undefined ? tvp_nominator.stash : "unknown";

      verifyProxyCall(proxy_data, stash);



    }
  });

}

async function verifyProxyCall(proxy_nomination: PendingNomination, stash: string) {

  var nominator_map = await Utility.getNominatorMap();
  var validators: string[] = [];
  //Extracts the nominations for the given nominator
  for (let [nom, val] of nominator_map) {
    if (nom == stash) {
      val.forEach(validator => {
        validators.push(validator);
      });
    }
  }

  //Finds all matches between what's on chain and what was sent via proxy
  var matching_validators = proxy_nomination.proxy_info.targets.filter(target => validators.indexOf(target) > -1); 

  if (matching_validators.length == proxy_nomination.proxy_info.targets.length){
    Messaging.sendMessage(`Proxy call for ${stash} was successfully executed.  Nomination changes were verified on chain and should be seen next era.`);
  }else{
    var percentage_change = ((matching_validators.length*100.00)/proxy_nomination.proxy_info.targets.length).toFixed(2);
    Messaging.sendMessage(`Proxy call for ${stash} was expected, however, ${percentage_change}% of the desired nominations were seen on-chain`);
  }
  console.log(`Targets`);
  console.log(proxy_nomination.proxy_info.targets.sort());
  console.log(`Validators`);
  console.log(validators.sort());
}

/*
  The main function loads variables from an external text file, as a matter of confirmation,
  the loaded settings are sent to the console.  

  An Api Promise is created and used to initialise the chain data singleton.  

  Three async methods are then executed.

  Monitor Proxy Announcements - This monitors for the proxy(announce) event and invokes an external
                                undisclosed API for nomination data.

  Monitor Era Change          - This method keeps track of changes of nominations for each nominator account
                                changes are represented by strikethroughs and an era count is kept.

  Monitor Proxy Changes       - This method anticipates when the proxy(announcement) is called and posts a
                                message that alerts users to expect a change in nominations within the next era.

                                It was intentionally designed to avoid monitoring of an on-chain event as these events
                                might fail or never occur.
*/

async function main() {


  await Utility.loadVariables();
  console.log(Settings);
  const api = await ApiPromise.create({ provider: new WsProvider(Settings.provider) });

  await Utility.initalizeChainData(api);
  await Messaging.initialize();

  monitorProxyAnnoucements();
  monitorEraChange();
  monitorProxyChanges();

}


main();
