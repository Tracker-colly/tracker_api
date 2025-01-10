import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { USER_TB } from "./USER_TB";
import { COMPANY_TB } from "./COMPANY_TB";
import { COMPANY_LINK_TB } from "./COMPANY_LINK_TB";
import { POLICY_TB } from "./POLICY_TB";
import { INFO_TB } from "./INFO_TB";
import { NOTICE_TB } from "./NOTICE_TB";
import { REPORT_TB } from "./REPORT_TB";
import { FAQ_TB } from "./FAQ_TB";
import { AUTH_NUM_TB } from "./AUTH_NUM_TB";
import { RECOMMED_TB } from "./RECOMMED_TB";
import { INBOX_TB } from "./INBOX_TB";
import { INSA_TB } from "./INSA_TB";
import { INSA_DOC_TB } from "./INSA_DOC_TB";
import { SEND_DOC_TB } from "./SEND_DOC_TB";
import { ALARM_TB } from "./ALARM_TB";
import { ADMIN_USER_TB } from "./ADMIN_USER_TB";


dotenv.config();

export const mysqlDataSource = new DataSource( {
    type: "mysql",
    host: process.env.MYSQL_HOST || "localhost",
    port: process.env.MYSQL_PORT ? Number( process.env.MYSQL_PORT ) : 3306,
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,

    // timezone: process.env.DB_TIMEZONE,
    timezone: "Z",

    synchronize: process.env.MYSQL_SYNC === "true",
    logging: process.env.MYSQL_LOGGING === "true",
    // logging: true,

    entities: [
        USER_TB,
        AUTH_NUM_TB,
        COMPANY_TB,
        COMPANY_LINK_TB,
        INBOX_TB,
        RECOMMED_TB,
        INSA_TB,
        INSA_DOC_TB,
        POLICY_TB,
        NOTICE_TB,
        REPORT_TB,
        FAQ_TB,
        INFO_TB,
        SEND_DOC_TB,
        ALARM_TB,
        ADMIN_USER_TB,
    ]
} );

export const dbConnect = () =>
{
    return new Promise<Boolean>( async ( res ) =>
    {
        try {
            await mysqlDataSource.initialize();

            res( true );
        }
        catch ( error ) {
            console.log( "DataSource initialize error!" );
            console.log( error );
            res( false );
        }
    } );
}; 
