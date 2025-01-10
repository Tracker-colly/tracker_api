import path from "path";
import fs from "fs";
import { uuidv4 } from "./util";

export const saveImage = async ( fileData: { base: string, ext: string } ) =>
{
    try {
        let folder = "images"
        let fileName = uuidv4() + "." + fileData.ext;
        let rootPath = process.env.PWD;
        let filePath = path.join( rootPath, "public", folder, fileName )

        let fileBuffer = Buffer.from( fileData.base.split( "," )[1], "base64" )
        fs.writeFileSync( filePath, fileBuffer );
        return path.join( "/" + folder, fileName )
    } catch ( e ) {
        console.log( "[saveProfile] error:", e )
        return ""
    }
}

export const deleteFile = ( filePath: string ) =>
{
    try {
        let rootPath = process.env.PWD;
        let deletePath = path.join( rootPath, "public", filePath )

        fs.unlinkSync( deletePath )

        return true
    } catch ( e ) {
        return false
    }
}