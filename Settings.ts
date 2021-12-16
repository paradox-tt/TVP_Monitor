import { TVP_Account } from "./Types";

export class Settings {
    
    static bot_path = '.';

    static provider = "";

    static session_blocks = -1;

    static proxy_delay_blocks = -1;

    static matrix_accessToken = "";

    static room_id = "";

    static retry_time = -1;

    static tvp_nominators:TVP_Account[]=[];

    static proxy_url="";

    static candidate_url="";

    static nomination_url="";
}