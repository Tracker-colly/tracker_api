import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, OneToMany, BeforeUpdate } from "typeorm";
import { encryptePassword } from "../libs/util";

@Entity( "TC_COMPANY_TB", { comment: "회사" } )
export class COMPANY_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Index()
    @Column( {
        nullable: false,
        comment: "시리얼",
    } )
    public serial: string;

    @Column( {
        nullable: false,
        comment: "회사명",
    } )
    public name: string;

    @Column( {
        nullable: false,
        comment: "전화번호",
    } )
    public tel: string;

    @Column( {
        nullable: false,
        comment: "정보",
        type: "text"
    } )
    public info: string;

    @Column( {
        nullable: false,
        comment: "홈페이지",
    } )
    public url: string;

    @Column( {
        nullable: false,
        comment: "sido",
        type: "text",
    } )
    public sido: string;

    @Column( {
        nullable: false,
        comment: "기본주소",
        type: "text",
    } )
    public address1: string;

    @Column( {
        nullable: false,
        comment: "상세주소",
        type: "text",
    } )
    public address2: string;

    @Column( {
        nullable: true,
        comment: "사진1",
        type: "text",
    } )
    public photo1: string;

    @Column( {
        nullable: true,
        comment: "사진2",
        type: "text",
    } )
    public photo2: string;

    @Column( {
        nullable: true,
        comment: "사진3",
        type: "text",
    } )
    public photo3: string;

    @Column( {
        nullable: false,
        comment: "생성자 아이디",
    } )
    public userId: number;

    @Column( {
        comment: "공개설정",
        default: true
    } )
    public share: boolean;

    @Column( {
        comment: "연결요청 설정",
        default: false
    } )
    public link: boolean;

    @Column( {
        nullable: true,
        comment: "메모"
    } )
    public memo: string

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}
