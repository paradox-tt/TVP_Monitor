import { ApiPromise, WsProvider } from "@polkadot/api";
import { Utility } from "./Utility";
import { Codec } from '@polkadot/types-codec/types/codec';
import { Settings } from "./Settings";
import { Messaging } from "./Messaging";

main();

async function main() {
    await Utility.loadVariables();
    const api = await ApiPromise.create({ provider: new WsProvider(Settings.provider) });
    await Utility.initalizeChainData(api);
    await Messaging.initialize();

    const session_five_blockhash = await getPreviousNominationHash();
    console.log(session_five_blockhash);
    const active_validators_codec = await api.query.session.validators();

    const active_validators = JSON.parse(JSON.stringify(active_validators_codec));

    const api_at = await api.at(session_five_blockhash);
    const previous_era = CodecToObject(await api_at.query.staking.activeEra());

    const x = await Utility.getNominators();

    const tvp_candidates = await Utility.getCandidates();

    var total_active_validators = 0;
    var total_nominated_validators = 0;

    var output = [];

    for (var i = 0; i < x.length; i++) {

        var nominees = CodecToObject(await api_at.query.staking.nominators(x[i].stash));

        output.push(`Nominator ${x[i].stash} - nominated the following ${nominees.targets.length} validators at the beginning of session 5 of the previous era (${previous_era.index}).`);
        output.push('<br/><br/><ul>');

        total_nominated_validators += nominees.targets.length;
        for (var y = 0; y < nominees.targets.length; y++) {

            if (active_validators.indexOf(nominees.targets[y]) > -1) {
                total_active_validators++;
            }

            output.push(`<li> ${active_validators.indexOf(nominees.targets[y]) < 0 ? `🔴` : `🟢`} - ${Utility.getName(tvp_candidates, nominees.targets[y], true)}</li>`);
        }
        output.push('</ul><br/>');

    }

    output.push(`<p>A total of ${total_nominated_validators} validators were nominated and ${total_active_validators} (${((total_active_validators / total_nominated_validators) * 100.00).toFixed(2)}%) made it to the active set.</p>`);

    Messaging.sendMessage(output.join(""));

}

async function getPreviousNominationHash(): Promise<string> {
    //const cd = ChainData.getInstance();
    //const api = cd.getApi();
    const POLKADOT_APPROX_ERA_LENGTH_IN_BLOCKS = 14400;
    const api = await ApiPromise.create({ provider: new WsProvider(Settings.provider) });

    var active_era_codec = await api.query.staking.activeEra();
    var active_era = CodecToObject(active_era_codec).index;

    var target_session = parseInt((await api.query.staking.erasStartSessionIndex(active_era - 1)).toString()) + 4;

    var current_block = (await api.rpc.chain.getBlock()).block.header.number.toNumber();

    //count backward in groups of 100 until the target session is passed

    console.log(`Jumping backward`);
    var current_session = CodecToObject(await api.query.session.currentIndex());

    var block_hash = await api.rpc.chain.getBlockHash(current_block);

    while (current_session >= target_session) {
        current_block -= 100;
        block_hash = await api.rpc.chain.getBlockHash(current_block);
        var api_at = await api.at(block_hash);
        current_session = CodecToObject(await api_at.query.session.currentIndex());
        console.log(current_session);
    }
    console.log(`Tiptoe-ing forward`);
    //slowly move up by 1 block
    while (current_session != target_session) {
        current_block++;
        block_hash = await api.rpc.chain.getBlockHash(current_block);
        var api_at = await api.at(block_hash);
        current_session = CodecToObject(await api_at.query.session.currentIndex());
        console.log(current_session);
    }


    return block_hash.toString();
}

function CodecToObject(item: Codec) {
    const res = JSON.parse(item.toString());
    return res;
}