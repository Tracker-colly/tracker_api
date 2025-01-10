import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, OneToMany, BeforeUpdate } from "typeorm";
import { encryptePassword } from "../libs/util";

@Entity( "TC_ADMIN_USER_TB", { comment: "관리자" } )
export class ADMIN_USER_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        nullable: false,
        comment: "아이디",
    } )
    public account: string;

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
        nullable: false,
        comment: "이메일",
    } )
    public email: string;

    @Column( {
        comment: "등급 1=정상, 9=삭제",
        type: "tinyint",
        default: 1,
        width: 2
    } )
    public status: number

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
