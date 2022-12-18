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

	await executeProxyChanges("");
	await executeEraChange();

	Messaging.sendMessage('Waiting for proxy event..');

	api.query.system.events((events) => {

		events.forEach((record) => {
			// Extract the phase, event and the event types
			const { event } = record;
			// If the event is a proxy(announce)
			if (api.events.proxy.Announced.is(event)) {
				//Get the public key from data[0] and then convert to the chain address
				const nominator_account = encodeAddress(event.data[0].toString(), prefix);

				//If the nominator_account is one of the 1KV nominator accounts then
				if (Settings.tvp_nominators.find(nominator => nominator.controller == nominator_account)) {
									
					executeProxyChanges(nominator_account);
					
				}
			}

		});
	});

}

async function executeProxyChanges(nom: string) {
	let monitor = MonitoredData.getInstance();
	let chain_data = ChainData.getInstance();
	Utility.tvp_candidates = await Utility.getCandidates();

	var nominators: string[] = [];

	//In the unlikely event that API is undefined then exit by return;
	const api = chain_data.getApi();
	if (api == undefined) {
		return;
	}

	if (nom == "") {
		Settings.tvp_nominators.forEach(nominator_account => {
			nominators.push(nominator_account.controller);
		});
	} else {
		nominators.push(nom);
	}

	var for_nominator = (nom != "") ? `for ${nom} ` : '';

	Messaging.sendMessage(`Loading possible proxy assignments ${for_nominator}in a few minutes...`);
	//Preloads possible candidates
	await new Promise(f => setTimeout(f, Settings.retry_time));

	nominators.forEach(nominator => {
		Utility.getProxyNominees(nominator).then(proxy_data => {
			if (proxy_data.length > 0) {
				monitor.addProxyCall({
					nominator: nominator,
					proxy_info: proxy_data[0]
				});
			}
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

	//executeEraChange();
	if (chain_data.getChain() == "polkadot") {
		showActiveNominationSummary();
	}

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
					//executeEraChange();

					if (chain_data.getChain() == "polkadot") {
						showActiveNominationSummary();
					}

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

	Messaging.sendMessage(`Loading nomination data for era <b>${await chain_data.getCurrentEra()}<b>...`);
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
	var total_nominations: number = 0;
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
	var nominated_voters_percent = ((nominated_voters.length * 100.0) / validator_map.length).toFixed(2);

	var val_scores = validator_map.map(x => x.val).sort((a, b) => Utility.getScore(Utility.tvp_candidates, a) - Utility.getScore(Utility.tvp_candidates, b));
	val_scores = val_scores.filter(val => Utility.getScore(Utility.tvp_candidates, val) > 0);


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
			output.push(`${Utility.getName(Utility.tvp_candidates, val.val, false)}`);
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
		Messaging.sendMessage("");
	}, 4000);

}

async function showActiveNominationSummary() {

	//Issues a delay for the summary so that it displays last.
	Messaging.sendMessage(`Preparing summary of nominations issued in the previous era...`);
	setTimeout(() => {
		Messaging.sendMessage("");
	}, 120000);

	const api = await ApiPromise.create({ provider: new WsProvider(Settings.provider) });

	const session_five_blockhash = await Utility.getPreviousNominationHash();
	console.log(session_five_blockhash);
	const active_validators_codec = await api.query.session.validators();

	const active_validators = JSON.parse(JSON.stringify(active_validators_codec));

	const api_at = await api.at(session_five_blockhash);
	const previous_era = Utility.CodecToObject(await api_at.query.staking.activeEra());

	const x = await Utility.getNominators();

	const tvp_candidates = await Utility.getCandidates();

	var total_active_validators = 0;
	var total_nominated_validators = 0;

	var output = [];

	for (var i = 0; i < x.length; i++) {

		var nominees = Utility.CodecToObject(await api_at.query.staking.nominators(x[i].stash));

		output.push(`Nominator ${x[i].stash} - nominated the following ${nominees.targets.length} validators at the beginning of session 5 of the previous era (${previous_era.index}).`);
		output.push('<br/><br/><ul>');

		total_nominated_validators += nominees.targets.length;
		for (var y = 0; y < nominees.targets.length; y++) {

			if (active_validators.indexOf(nominees.targets[y]) > -1) {
				total_active_validators++;
			}

			var streak = await Utility.getValidationStreak(nominees.targets[y]);

			output.push(`<li> ${active_validators.indexOf(nominees.targets[y]) < 0 ? `🔴` : `🟢`} - <b>${Utility.getName(tvp_candidates, nominees.targets[y], true)}</b> <br/>
			<sup>Active for ${streak} era${(streak != 1 ? 's' : '')} | Score - ${Utility.getScore(Utility.tvp_candidates, nominees.targets[y]).toFixed(2)}</sup>
			</li>`);
		}
		output.push('</ul><br/>');

	}

	output.push(`<p>A total of ${total_nominated_validators} validators were nominated and ${total_active_validators} (${((total_active_validators / total_nominated_validators) * 100.00).toFixed(2)}%) made it to the active set.</p>`);

	Messaging.sendMessage(output.join(""));

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

	let last_nomination_called = new Date();
	
	const api = chain_data.getApi();
	if (api == undefined) {
		return;
	}

	await api.rpc.chain.subscribeNewHeads((header) => {

		var block_number: number = parseInt(header.number.unwrap().toString());
		var proxy_data = monitor.hasProxyCall(block_number);

		if (proxy_data != undefined) {
			Messaging.initialize();
			var tvp_nominator = Settings.tvp_nominators.find(nominator => nominator.controller == proxy_data!.nominator);
			var stash = tvp_nominator != undefined ? tvp_nominator.stash : "unknown";
			const current_datetime = new Date();

			verifyProxyCall(proxy_data, stash);

					//If the time between the two calls is more than a minute, 
					//then schedule a threaded call to show nominations in 10 minutes
					if(current_datetime.getTime() - last_nomination_called.getTime() > 5*60*1000){
						last_nomination_called = new Date();
						setTimeout(() => {
							executeEraChange();
						}, 10*60*1000);
					}

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

	if (matching_validators.length == proxy_nomination.proxy_info.targets.length) {
		Messaging.sendMessage(`Proxy call for ${stash} was successfully executed.  Nomination changes were verified on chain and should be seen next era.`);
	} else {
		var percentage_change = ((matching_validators.length * 100.00) / proxy_nomination.proxy_info.targets.length).toFixed(2);
		Messaging.sendMessage(`Proxy call for ${stash} was expected, however, ${percentage_change}% of the desired nominations were seen on-chain`);
	}
	console.log(`Targets`);
	console.log(proxy_nomination.proxy_info.targets.map(val => Utility.getName(Utility.tvp_candidates, val, false)).sort());
	console.log(`Validators`);
	console.log(validators.map(val => Utility.getName(Utility.tvp_candidates, val, false)).sort());
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

	//const x = await Utility.getValidationStreak(`14hM4oLJCK6wtS7gNfwTDhthRjy5QJ1t3NAcoPjEepo9AH67`);
	//console.log(x);

}


main();
