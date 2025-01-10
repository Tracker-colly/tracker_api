import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
import { defaultDoc } from "../libs/config";

type EvalDataType = {
    title: string
    child: {
        title: string
        message: string
    }[]
}

@Entity( "TC_INSA_DOC_TB", { comment: "인사평가 양식" } )
export class INSA_DOC_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "회사 아이디",
    } )
    public comId: number;

    @Column( {
        comment: "평가 데이터",
        type: "json",
    } )
    public evalData: EvalDataType[];

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}