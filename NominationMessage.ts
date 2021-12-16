import { Nomination, Nominee } from "./Types";
import { Utility } from "./Utility";
import { ChainData } from "./ChainData";

export class NominationMessage {

    private nomination: Nomination;

    public constructor(nom_data: Nomination) {
        if (nom_data == undefined) {
            this.nomination = <Nomination>{};
        } else {
            this.nomination = nom_data;
        }
    }

    public async generateString(): Promise<string> {
        var output: string[] = [];
        let chain_data = ChainData.getInstance();

        output.push(`<p>1KV nominator (${this.nomination.nominator}) nominated the following ${this.nomination.nominees.length} validators in era <b>${this.nomination.era}</b>`);
        if (chain_data.getPrefix() == 0) {
            output.push(`<br/><i>Note: The nomination account will leave in session 5 of era ${this.nomination.era} and the validators might be elected in era <b>${this.nomination.era + 1}</b></i>`);
        }
        output.push(':</p>');
        await Utility.getCandidates().then(candidates => {
            output.push("<ul>");


            this.nomination.nominees.forEach(nominee => {

                var candidate_name = Utility.getName(candidates, nominee.val_address);

                output.push(`<li>${candidate_name} - ${nominee.nomination_count} era(s)</li>`);

            });

            output.push("</ul>");


        });

        return output.join("");
    }

    async generateDuplicateString(previous_nomination: Nomination, difference: Nominee[]) {
        var output: string[] = [];
        let chain_data = ChainData.getInstance();

        var percentage_change = (((difference.length * 1.0) / (this.nomination.nominees.length * 1.0)) * 100.00).toFixed(2);


        output.push(`<p>1KV nominator (${this.nomination.nominator}) nominated the following ${this.nomination.nominees.length} validators in era <b>${this.nomination.era}</b><br/>`);
        if (chain_data.getPrefix() == 0) {
            output.push(`<i>Note: The nomination account will leave in session 5 of era ${this.nomination.era} and the validators might be elected in era <b>${this.nomination.era + 1}</b></i><br/>`);
        }
        output.push(`${percentage_change}% of the nominations changed.</p>`);


        await Utility.getCandidates().then(candidates => {
            output.push("<ul>");
            previous_nomination.nominees.forEach(previous_nominee => {

                var prev_candidate_name = Utility.getName(candidates, previous_nominee.val_address);
                //var prev_candidate_name = this.getName(candidates,previous_nominee);

                if (this.nomination.nominees.find(nominee => nominee.val_address == previous_nominee.val_address) == undefined) {
                    if (difference.length > 0) {

                        var new_candidate = difference.pop();

                        if (new_candidate != undefined) {
                            var new_candidate_name = Utility.getName(candidates, new_candidate.val_address);

                            output.push(`<li><del>${prev_candidate_name}</del> <b>-></b> <ins>${new_candidate_name}</ins></li>`);
                        }
                    }

                } else {
                    var current_candidate = this.nomination.nominees.find(item => item.val_address == previous_nominee.val_address);
                    if (current_candidate != undefined) {
                        output.push(`<li>${prev_candidate_name} - ${current_candidate.nomination_count} era(s)</li>`);
                    } else {
                        output.push(`<li>${prev_candidate_name} - error finding era</li>`);
                    }

                }


            });

            output.push("</ul>");
        });


        return output.join("");
    }
}