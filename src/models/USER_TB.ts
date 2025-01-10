import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, OneToMany, BeforeUpdate } from "typeorm";
import { encryptePassword } from "../libs/util";

@Entity( "TC_USER_TB", { comment: "유저" } )
export class USER_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        nullable: false,
        comment: "시리얼",
    } )
    public serial: string;

    @Column( {
        nullable: false,
        comment: "이메일",
    } )
    public email: string;

    @Column( {
        nullable: true,
        comment: "비밀번호",
    } )
    public password: string;

    @Column( {
        nullable: false,
        comment: "이름",
    } )
    public name: string;

    @Column( {
        nullable: false,
        comment: "휴대폰 번호",
    } )
    public hp: string;

    @Column( {
        comment: "생년월일",
        nullable: true,
    } )
    public birth: string

    @Column( {
        comment: "성별 1=남성,2=여성",
        width: 2,
        default: 1
    } )
    public sex: number;

    @Column( {
        comment: "마케팅 동의",
        default: false
    } )
    public marketing: boolean;

    @Column( {
        comment: "푸쉬",
        default: true
    } )
    public push: boolean;

    @Column( {
        comment: "링크",
        default: true
    } )
    public link: boolean;

    @Column( {
        nullable: true,
        comment: "프로필 사진",
        type: "text",
    } )
    public profile: string

    @Column( {
        nullable: false,
        comment: "시/도",
        type: "text",
    } )
    public sido: string

    @Column( {
        nullable: true,
        comment: "주소1",
        type: "text",
    } )
    public address1: string

    @Column( {
        nullable: true,
        comment: "주소2",
        type: "text",
    } )
    public address2: string

    @Column( {
        comment: "등급 1=유저, 10=관리자",
        type: "tinyint",
        default: 1,
        width: 2
    } )
    public level: number;

    @Column( {
        comment: "등급 1=정상, 2=정지, 9=탈퇴",
        type: "tinyint",
        default: 1,
        width: 2
    } )
    public status: number

    @Column( {
        nullable: true,
        comment: "메모"
    } )
    public memo: string

    @Column( {
        comment: "탈퇴일",
        type: "datetime",
        default: null
    } )
    public deletedAt: Date;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;

    @BeforeInsert()
    saveEncryptedPassword()
    {
        //비밀번호 암호화
        if ( this.password ) {
            this.password = encryptePassword( this.password );
        }
    }
}
