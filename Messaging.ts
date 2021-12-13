import { Settings } from './Settings';
import { MatrixClient } from "matrix-bot-sdk";

export class Messaging{

    static async sendMessage(message:string){
        const sdk = require("matrix-bot-sdk");
        const MatrixClient = sdk.MatrixClient;
        const SimpleFsStorageProvider = sdk.SimpleFsStorageProvider;
        const AutojoinRoomsMixin = sdk.AutojoinRoomsMixin;
    
        const homeserverUrl = "https://matrix.org"; // make sure to update this with your url
        
        const storage = new SimpleFsStorageProvider(`${Settings.bot_path}/bot.json`);
    
        const client:MatrixClient = new MatrixClient(homeserverUrl, Settings.matrix_accessToken, storage);
        AutojoinRoomsMixin.setupOnClient(client);
        
        client.start().then((x:MatrixClient)=>{
            console.log("Matrix client initiated");
            client.sendHtmlText(Settings.room_id,message);
        });
    
    }

}
