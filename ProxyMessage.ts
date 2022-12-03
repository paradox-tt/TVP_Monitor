import { ChainData } from "./ChainData";
import { Settings } from "./Settings";
import { PendingNomination, TVP_Account, Nominee } from "./Types";
import { Utility } from "./Utility";

export class ProxyMessage {

    private tvp_account: TVP_Account;
    private nominees: string[];

    public constructor(nom_data: PendingNomination) {

        var temp_tvp = Settings.tvp_nominators.find(account => account.controller == nom_data.nominator);

        if (temp_tvp == undefined) {
            this.tvp_account = <TVP_Account>{};
        } else {
            this.tvp_account = temp_tvp;
        }

        if (nom_data.proxy_info.targets == undefined) {
            this.nominees = [];
        } else {
            this.nominees = nom_data.proxy_info.targets;
        }


    }


    async generateNewString(): Promise<string> {
        var output: string[] = [];

        this.nominees = this.nominees.sort((a, b) => Utility.getScore(Utility.tvp_candidates, b) - Utility.getScore(Utility.tvp_candidates, a));
        var nominees_array: Nominee[] = this.nominees.map(x => {
            return {
                val_address: x,
                nomination_count: 0,
                score: 0,
                streak: 0
            }
        });
        nominees_array = await Utility.setValidatorStreak(nominees_array);

        output.push(`<p>The following (${this.nominees.length}) validators should be nominated by ${this.tvp_account.stash} <br/>`);
        output.push(`Scores ranged from ${Utility.getScore(Utility.tvp_candidates, this.nominees[this.nominees.length - 1]).toFixed(2)} to ${Utility.getScore(Utility.tvp_candidates, this.nominees[0]).toFixed(2)}</p>`);


        output.push("<ul>");

        nominees_array.forEach(nominee => {

            var candidate_name = Utility.getName(Utility.tvp_candidates, nominee.val_address, true);

            output.push(`<li><b>${candidate_name}</b><br/>
            <sup>Active for ${nominee.streak} era${(nominee.streak != 1 ? 's' : '')} | Score - ${Utility.getScore(Utility.tvp_candidates, nominee.val_address).toFixed(2)}</sup>
            </li>`);

        });

        output.push("</ul>");



        return output.join("");
    }

    async generateDuplicateString(previous_nominees: string[]): Promise<string> {

        if (previous_nominees == undefined) {
            previous_nominees = [];
        }

        var output: string[] = [];

        var difference:Nominee[] = this.nominees.filter(item => previous_nominees.indexOf(item) < 0).map(x => {
            return {
                val_address: x,
                nomination_count: 0,
                score: 0,
                streak: 0
            }
        });



        var percentage_change = (((difference.length * 1.0) / (this.nominees.length * 1.0)) * 100.00).toFixed(2);

        let chain_data = ChainData.getInstance();
        var era = await chain_data.getCurrentEra();
        var candidates_listed: string[] = [];

        chain_data.getPrefix() == 2 ? era += 4 : era += 2;

        this.nominees = this.nominees.sort((a, b) => Utility.getScore(Utility.tvp_candidates, b) - Utility.getScore(Utility.tvp_candidates, a));

        output.push(`<p>The following (${this.nominees.length}) validators should be nominated by ${this.tvp_account.stash} in <b>18</b> hrs.<br/>`);
        output.push(`Scores ranged from ${Utility.getScore(Utility.tvp_candidates, this.nominees[this.nominees.length - 1]).toFixed(2)} to ${Utility.getScore(Utility.tvp_candidates, this.nominees[0]).toFixed(2)}. <br/>`);
        output.push(`These validators should be active in era ${era}.<br/>`)
        output.push(`${percentage_change}% of the nominations changed.</p>`);

        if (percentage_change == "0.00") {
            output.push(`<details><summary>Click here for details</summary>`);
        }

        output.push("<ul>");
        previous_nominees.forEach(previous_nominee => {

            var prev_candidate_name = Utility.getName(Utility.tvp_candidates, previous_nominee, false);
            //var prev_candidate_name = this.getName(candidates,previous_nominee);

            if (this.nominees.find(nominee => nominee == previous_nominee) == undefined) {
                if (difference.length > 0) {

                    var new_candidate = difference.pop();
                    if (new_candidate != undefined) {
                        var new_candidate_name = Utility.getName(Utility.tvp_candidates, new_candidate.val_address, true);

                        output.push(`<li><del>${prev_candidate_name}</del> <b>-></b> <ins><b>${new_candidate_name}</b></ins> <br/>
                        <sup>Active for ${new_candidate.streak} era${(new_candidate.streak != 1 ? 's' : '')} | Score - ${Utility.getScore(Utility.tvp_candidates, new_candidate.val_address).toFixed(2)}</sup>
                        </li>`);
                        candidates_listed.push(new_candidate.val_address);
                    }
                }

            } else {
                output.push(`<li>${prev_candidate_name}</li>`);
                candidates_listed.push(previous_nominee);
            }

        });

        //Before we close, list any current candidates that wasn't listed, this is useful when the system elected
        //fewer candidates by error
        if (this.nominees != undefined) {
            this.nominees.forEach(nominee => {
                if (candidates_listed.indexOf(nominee) < 0) {
                    var missing_candidate_name = Utility.getName(Utility.tvp_candidates, nominee, true);
                    output.push(`<li>${missing_candidate_name}</li>`);
                }
            });
        }

        output.push("</ul>");

        if (percentage_change == "0.00") {
            output.push(`</details>`);
        }

        return output.join("");
    }

}