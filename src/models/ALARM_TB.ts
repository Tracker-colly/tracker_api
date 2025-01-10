import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";

@Entity( "TC_ALARM_TB", { comment: "알림" } )
export class ALARM_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "1=공지,2=문의,3=수락,4=거절,5=추천서요청,6=제출요청"
    } )
    public type: number;

    @Column( {
        comment: "알림 유저"
    } )
    public userId: number;

    @Column( {
        comment: "타겟 유저",
        nullable: true,
    } )
    public targetId: number;

    @Column( {
        comment: "확인 여부",
        default: false
    } )
    public view: boolean;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}