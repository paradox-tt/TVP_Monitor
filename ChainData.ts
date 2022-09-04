import { ApiPromise } from '@polkadot/api';

export class ChainData {
    private static instance: ChainData;
    private chain:string;
    private prefix:number;
    private api:ApiPromise|undefined;

    private constructor() { 
        this.prefix=-1;
        this.chain="";
        this.api = undefined;
    }

    public static getInstance(): ChainData {
        if (!ChainData.instance) {
            ChainData.instance = new ChainData();
        }

        return ChainData.instance;
    }

    public setPrefix(prefix:number){
        if(prefix==2){
            this.prefix = prefix;
            this.chain = "kusama";
        }else{
            this.prefix = 0;
            this.chain = "polkadot";
        }
    }

    public getPrefix(){
        return this.prefix;
    }

    public getChain(){
        return this.chain;
    }

    public async getCurrentEra(){
        
        const api = await this.getApi();

        if(api==undefined){
            return -1;
        }else{
            var result = (await api.query.staking.activeEra()).toString();
                console.log(result);
            return parseInt(JSON.parse(result).index);
        }


    }

    public setApi(api:ApiPromise){
        this.api = api;
    }

    public getApi(){
        
        return this.api;
    }

}