import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";

@Entity( "TC_INFO_TB", { comment: "정보" } )
export class INFO_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "회사명",
    } )
    public companyName: string;

    @Column( {
        comment: "대표자",
    } )
    public ceo: string;

    @Column( {
        comment: "사업자등록번호",
    } )
    public companyNo1: string;

    @Column( {
        comment: "통신판매업신고",
    } )
    public companyNo2: string;

    @Column( {
        comment: "앱스토어",
        type: "text"
    } )
    public appleLink: string;

    @Column( {
        comment: "플레이스토어",
        type: "text"
    } )
    public googleLink: string;

    @Column( {
        comment: "회사주소",
        type: "text"
    } )
    public address: string;

    @Column( {
        comment: "저작권 문구",
    } )
    public copyright: string;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}