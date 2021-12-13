import { Messaging } from "./Messaging";
import { TVP_Candidate, ProxyAssignments, Nomination, Nominee } from "./Types";
import { MonitoredData } from "./MonitoredData";
import { Settings } from "./Settings";
import { ChainData } from './ChainData';
import { ApiPromise } from '@polkadot/api';
import fetch from "node-fetch";
import * as fs from 'fs';
import * as rd from 'readline'

export class Utility {

    static async getCandidates(): Promise<TVP_Candidate[]> {
        let chain_data = ChainData.getInstance();
        const network = chain_data.getChain();

        var fetch_url = `https://${network}${Settings.candidate_url}`

        var fetch_result = await fetch(fetch_url);

        while (fetch_result.status != 200) {
            Messaging.sendMessage("I am having troubles finding candidate data, retrying in a minute");
            await new Promise(f => setTimeout(f, Settings.retry_time));
            fetch_result = await fetch(fetch_url);
        }

        var candidates: TVP_Candidate[] = await fetch_result.json();

        return candidates;
    }

    static async getProxyNominees(controller: string): Promise<ProxyAssignments> {
        let chain_data = ChainData.getInstance();
        const network = chain_data.getChain();

        var proxy_url = `https://${network}${Settings.proxy_url}`;

        var fetch_result = await fetch(proxy_url);

        while (fetch_result.status != 200) {
            Messaging.sendMessage("I am having troubles finding pending nominations, retrying in 1 minute");
            await new Promise(f => setTimeout(f, Settings.retry_time));
            fetch_result = await fetch(proxy_url);
        }

        var assignments: ProxyAssignments[] = await fetch_result.json();
        //console.log(results.length);
        let result: ProxyAssignments = <ProxyAssignments>{};

        await assignments.forEach(proxy_assignment => {
            if (proxy_assignment.controller == controller) {

                if (Object.keys(result).length === 0) {
                    result = proxy_assignment;
                } else {
                    if (proxy_assignment.number > result.number) {
                        result = proxy_assignment;
                    }
                }
            }
        });

        return result;
    }


    static async getValidatorNominations(val_address: string): Promise<Nomination> {

        let monitor = MonitoredData.getInstance();
        let chain_data = ChainData.getInstance();

        const api = chain_data.getApi();
        if (api == undefined) {
            return <Nomination>{};
        }

        const nominations = await api.query.staking.nominators.entries();

        var result: Nomination = <Nomination>{ era: monitor.getEra(), nominator: val_address, nominees: [] };


        var add_tvp_array = false;

        for (let [nom_address, validators] of nominations) {

            if (val_address.indexOf(nom_address!.toHuman()!.toString()) > -1) {
                add_tvp_array = true;
            }

            for (var i = 0; i < validators.unwrapOrDefault().targets.length; i++) {
                const validator = validators.unwrapOrDefault().targets[i].toHuman();

                if (add_tvp_array) {
                    result.nominees.push(<Nominee>{ val_address: validator, nomination_count: 1 });
                }

            }

            add_tvp_array = false;
        }

        return result;
    }

    static getName(candidates: TVP_Candidate[], stash: string): string {
        var candidate = candidates.find(candidate => candidate.stash == stash);

        if (candidate != undefined) {
            var candidate_name;

            if (candidate.identity != undefined) {

                candidate_name = candidate.identity.name;

                if (candidate.identity.sub != undefined) {
                    candidate_name = `${candidate.identity.name}/${candidate.identity.sub}`;
                }
            }

            if (candidate.score != undefined) {
                return `${candidate_name} - (${candidate.score.aggregate.toFixed(2)})`;
            }

            return "Error";
        } else {
            return "Not found";
        }

    }

    static async loadVariables() {

        var path = '';


        const path_header = 'path=';

        process.argv.forEach(arguement => {
            if (arguement.indexOf(path_header) == 0) {
                path = arguement.substr(path_header.length);
            }
        });

        const rl = rd.createInterface({
            input: fs.createReadStream(path)
        });

        console.log(`Attempting to load settings from ${path}...`);

        var line_info = "";

        for await (const line of rl) {

            line_info += line.trim();
            if (line_info.indexOf(';') == (line_info.length - 1) && line_info != "") {

                //Removes ; character at the end of the string
                line_info = line_info.substr(0, line_info.length - 1);

                var key = line_info.substr(0, line_info.indexOf(':')).trim();
                var value = line_info.substr(key.length + 1).trim();

                //If the value is a string with that starts and ends with a single quote 
                //the remove the start and end quote
                if (value[0] == '\'' && value[value.length - 1] == '\'') {
                    value = value.substr(1, value.length - 2);
                }

                this.applySetting(key, value);
                line_info = "";
            }

        }

        console.log(`Settings loaded.`);

    }

    static applySetting(key: string, value: string) {

        switch (key) {
            case "bot_path":
                Settings.bot_path = value;
                break;
            case "provider":
                Settings.provider = value;
                break;
            case "session_blocks":
                Settings.session_blocks = parseInt(value);
                break;
            case "proxy_delay_blocks":
                Settings.proxy_delay_blocks = parseInt(value);
                break;
            case "matrix_accessToken":
                Settings.matrix_accessToken = value;
                break;
            case "room_id":
                Settings.room_id = value;
                break;
            case "retry_time":
                Settings.retry_time = parseInt(value);
                break;
            case "tvp_nominators":
                Settings.tvp_nominators = JSON.parse(value);
                break;
            case "proxy_url":
                Settings.proxy_url = value;
                break;
            case "candidate_url":
                Settings.candidate_url = value;
                break;
        }
    }

    static async initalizeChainData(api: ApiPromise) {
        console.log(`Loading chain data...`);
        let chain_data = ChainData.getInstance();
        const chainInfo = await api.registry.getChainProperties()
        var result = "0";

        if (chainInfo != null) {
            result = chainInfo.ss58Format.toString();
        }

        chain_data.setPrefix(parseInt(result));
        chain_data.setApi(api);

        console.log(`Chain data loaded.`);

    }


}