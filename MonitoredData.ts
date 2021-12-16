import { Messaging } from "./Messaging";
import { ProxyMessage } from "./ProxyMessage";
import { Nomination, PendingNomination, Nominee } from "./Types";
import { NominationMessage } from "./NominationMessage";
import { Settings } from "./Settings";

export class MonitoredData {
    private static instance: MonitoredData;
    private era:number;

    private proxy_info:PendingNomination[];
    private nomination_info:Nomination[];

    private constructor() { 
        this.proxy_info=[];
        this.nomination_info=[];
        this.era=-1;
    }

    public static getInstance(): MonitoredData {
        if (!MonitoredData.instance) {
            MonitoredData.instance = new MonitoredData();
        }

        return MonitoredData.instance;
    }

    public setEra(era:number){
        this.era=era;
    }

    public getEra(){
        return this.era;
    }

    public async addProxyCall(proxy_entry:PendingNomination) {
        
        var proxy_message:ProxyMessage = new ProxyMessage(proxy_entry);
        var previous_entry = this.proxy_info.find(nom=>nom.nominator==proxy_entry.nominator);

        //console.log(proxy_entry);

        if(previous_entry==undefined){
            await proxy_message.generateNewString().then(msg=>{
                Messaging.sendMessage(msg);
            });
        }else{
            await proxy_message.generateDuplicateString(previous_entry.proxy_info.targets).then(msg=>{
                Messaging.sendMessage(msg);
            });

            this.removeProxyCall(previous_entry.nominator);
        };    

        this.proxy_info.push(proxy_entry);
    }

    public hasProxyCall(block_number:number):PendingNomination{
        var result = this.proxy_info.find(entry=>(entry.proxy_info.number+Settings.proxy_delay_blocks+1)==block_number);       
        //var result = this.proxy_info[0];
        
        if(result==undefined){
            return <PendingNomination>{};
        }else{
            return result;
        }
    }

    public getNominations(controller:string):Nomination{

        var tvp_account = Settings.tvp_nominators.find(item=>item.controller==controller);
        var result = <Nomination>{};
        
        if(tvp_account!=undefined){
            var find_nom = this.nomination_info.find(entry=>entry.nominator==tvp_account?.stash);

            if(find_nom!=undefined){
                return find_nom;
            }
        }
        
        return result;
    }

    public removeProxyCall(controller:string){
        this.proxy_info = this.proxy_info.filter(entry=>entry.nominator!=controller);
    }

    public addNomination(nomination:Nomination){       

        if(this.nomination_info.length==0){
            this.nomination_info.push(nomination);

            var nomination_message = new NominationMessage(nomination);
            nomination_message.generateString().then(msg=>{
                Messaging.sendMessage(msg);
            });

        }else{

            var previous_nominee_index = this.nomination_info.findIndex(item=>item.nominator==nomination.nominator);

            if(previous_nominee_index==-1){
                this.nomination_info.push(nomination);
                
                var nomination_message = new NominationMessage(nomination);
                nomination_message.generateString().then(msg=>{
                    Messaging.sendMessage(msg);
                });
                
            }else{
                
                //Validators
                var differences:Nominee[]=[];
                var similar:Nominee[]=[];

                nomination.nominees.forEach(nominee=>{

                    let found = false;

                    //Looks for similiarities and adds one to the count if this is the case
                    this.nomination_info[previous_nominee_index].nominees.forEach(previous_nominee=>{
                        if(previous_nominee.val_address==nominee.val_address){
                            similar.push(<Nominee>{ val_address:previous_nominee.val_address, nomination_count:previous_nominee.nomination_count+1});
                            found=true;
                        }
                    });

                    //If there are no similarities
                    if(!found){
                        differences.push(<Nominee>{ val_address:nominee.val_address, nomination_count:1});
                    }

                });
                var previous_entry = this.nomination_info[previous_nominee_index];

                this.nomination_info[previous_nominee_index] = <Nomination>{ 
                                                                    era:nomination.era, 
                                                                    nominator:nomination.nominator, 
                                                                    nominees:differences.concat(similar)
                                                                };

                var nomination_message = new NominationMessage(this.nomination_info[previous_nominee_index]);

                
                
                nomination_message.generateDuplicateString(previous_entry,differences).then(msg=>{
                
                    Messaging.sendMessage(msg);
                });
                                    
            }

        }

    }
}