import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, OneToMany, BeforeUpdate } from "typeorm";
import { encryptePassword } from "../libs/util";

@Entity( "TC_COMPANY_LINK_TB", { comment: "회사 링크 유저" } )
export class COMPANY_LINK_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Index()
    @Column( {
        nullable: false,
        comment: "회사 아이디",
    } )
    public comId: number;

    @Index()
    @Column( {
        nullable: false,
        comment: "유저 아이디",
    } )
    public userId: number;

    @Column( {
        nullable: false,
        comment: "직책, 1=사원,2=주임,3=대리,4=과장,5=부장,6=이사,9=대표자",
        default: 1
    } )
    public code: number;

    @Index()
    @Column( {
        comment: "유저 레벨, 1=요청,2=스탭,3=관리자,4=링크해제,5=헤제후재요청,9=오너",
        default: 3,
    } )
    public level: number;

    @Column( {
        comment: "요청 확인",
        default: false,
    } )
    public isView: boolean;

    @Column( {
        nullable: true,
        comment: "종료 날짜 (링크 해제)",
        type: "datetime",
    } )
    public deleteAt: Date;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}
