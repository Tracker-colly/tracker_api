import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";

@Entity( "TC_POLICY_TB", { comment: "약관" } )
export class POLICY_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "약관 타입, 1=서비스이용약관, 2=개인정보",
        default: 0
    } )
    public type: number;

    @Column( {
        comment: "내용",
        type: "longtext",
    } )
    public text: string;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}