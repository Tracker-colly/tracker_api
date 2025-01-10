import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity( "TC_AUTH_NUM_TB", { comment: "인증번호" } )
export class AUTH_NUM_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Index()
    @Column( {
        comment: "email",
    } )
    public email: string;

    @Column( {
        comment: "인증번호",
        width: 6
    } )
    public number: string;

    @Index()
    @Column( {
        comment: "타입 1=이메일가입,2=비밀번호찾기,3=비밀번호변경",
        width: 2
    } )
    public type: number;

    @Column( {
        default: 0,
        width: 2,
        comment: "상태,0=미사용,1=사용"
    } )
    public state: number;

    @CreateDateColumn( {
        type: "datetime",
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;

}