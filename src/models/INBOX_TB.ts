import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";

@Entity( "TC_INBOX_TB", { comment: "인박스" } )
export class INBOX_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "타입 1=추천서제출요청,2=인사평가제출요청,3=추천서작성요청,4=추천서작성완료,5=인사평가완료,6=인사작성요청,7=추천제출완료,8=인사제출완료"
    } )
    public type: number;

    @Column( {
        comment: "요청 유저"
    } )
    public userId: number;

    @Column( {
        comment: "타겟 유저",
        nullable: true,
    } )
    public targetId: number;

    @Column( {
        comment: "타겟 유저 email",
        nullable: true,
    } )
    public targetEmail: string;

    @Column( {
        comment: "추천서/인사평가,SEND_DOC 아이디,회사 아이디 ",
        nullable: true
    } )
    public itemId: number;

    @Column( {
        comment: "확인 여부",
        default: false
    } )
    public view: boolean;

    @Column( {
        comment: "확인 여부",
        default: false
    } )
    public isAlarm: boolean;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}