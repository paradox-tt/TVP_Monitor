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

        output.push(`<p>1KV  (${this.nomination.nominator}) nominated the following ${this.nomination.nominees.length} validators in era <b>${this.nomination.era}</b><br/>`);
        try {
            output.push(`Scores ranged from ${this.nomination.nominees[this.nomination.nominees.length - 1].score.toFixed(2)} to ${this.nomination.nominees[0].score.toFixed(2)}:<br/>`);
        } catch (err) {
            console.log(err);
        }

        if (chain_data.getPrefix() == 0) {
            output.push(`<i>Note: The nomination account will leave in session 5 of era ${this.nomination.era} and the validators might be elected in era <b>${this.nomination.era + 1}</b></i>`);
        }
        output.push('</p>');

        output.push("<ul>");

        this.nomination.nominees = await Utility.setValidatorStreak(this.nomination.nominees);

        this.nomination.nominees.forEach(nominee => {

            var candidate_name = Utility.getName(Utility.tvp_candidates, nominee.val_address, true);

            output.push(`<li><b>${candidate_name}</b><br/>
            <sup>Active for ${nominee.streak} era${(nominee.streak != 1 ? 's' : '')} | Score - ${Utility.getScore(Utility.tvp_candidates, nominee.val_address).toFixed(2)}</sup>
            </li>`);

        });

        output.push("</ul>");

        return output.join("");
    }

    async generateDuplicateString(previous_nomination: Nomination, difference: Nominee[]) {
        var output: string[] = [];
        let chain_data = ChainData.getInstance();

        difference = await Utility.setValidatorStreak(difference);
        previous_nomination.nominees = await Utility.setValidatorStreak(previous_nomination.nominees);

        var percentage_change: string = (((difference.length * 1.0) / (this.nomination.nominees.length * 1.0)) * 100.00).toFixed(2);


        output.push(`<p>1KV nominator (${this.nomination.nominator}) nominated the following ${this.nomination.nominees.length} validators in era <b>${this.nomination.era}</b><br/>`);
        try {
            output.push(`Scores ranged from ${this.nomination.nominees[this.nomination.nominees.length - 1].score.toFixed(2)} to ${this.nomination.nominees[0].score.toFixed(2)}:<br/>`);
        } catch (err) {
            console.log(err);
        }

        if (chain_data.getPrefix() == 0) {
            output.push(`<i>Note: The nomination account will leave in session 5 of era ${this.nomination.era} and the validators might be elected in era <b>${this.nomination.era + 1}</b></i><br/>`);
        }
        output.push(`${percentage_change}% of the nominations changed.</p>`);

        if (percentage_change == "0.00") {
            output.push(`<details><summary>Click here for details</summary>`);
        }


        output.push("<ul>");
        previous_nomination.nominees.forEach(previous_nominee => {

            var prev_candidate_name = Utility.getName(Utility.tvp_candidates, previous_nominee.val_address, false);
            //var prev_candidate_name = this.getName(candidates,previous_nominee);

            if (this.nomination.nominees.find(nominee => nominee.val_address == previous_nominee.val_address) == undefined) {
                if (difference.length > 0) {

                    var new_candidate = difference.pop();

                    if (new_candidate != undefined) {
                        var new_candidate_name = Utility.getName(Utility.tvp_candidates, new_candidate.val_address, true);

                        output.push(`<li><del>${prev_candidate_name}</del> <b>-></b> <ins>${new_candidate_name}</ins> <br/>
                        <sup>Active for ${new_candidate.streak} era${(new_candidate.streak != 1 ? 's' : '')} | Score - ${Utility.getScore(Utility.tvp_candidates, new_candidate.val_address).toFixed(2)}</sups>
                        </li>`);
                    }
                }

            } else {
                var current_candidate = this.nomination.nominees.find(item => item.val_address == previous_nominee.val_address);
                if (current_candidate != undefined) {

                    output.push(`<li>${prev_candidate_name} - ${current_candidate.streak} era(s)</li>`);
                } else {
                    output.push(`<li>${prev_candidate_name} - error finding era</li>`);
                }

            }


        });

        output.push("</ul>");

        if (percentage_change == "0.00") {
            output.push(`</details>`);
        }

        return output.join("");
    }
}