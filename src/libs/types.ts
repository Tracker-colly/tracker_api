import { RES_CODE } from "./config"

export type DefaultResult = {
    code: RES_CODE,
    data?: any,
}

export enum InboxType
{
    recommendSubmit = 1,
    insaSubmit = 2,
    recommendWrite = 3,
    recommendWriteDone = 4,
    insaWriteDone = 5,
    insaWrite = 6,
    recommendSubmitDone = 7,
    insaSubmitDone = 8,
}

export enum AlarmType
{
    notice = 1,
    report = 2,
    link = 3,
    unlink = 4,
    recommend = 5,
    senddoc = 6,
    reqlink = 7
}