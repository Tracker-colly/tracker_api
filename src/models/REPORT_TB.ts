import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";

@Entity( "TC_REPORT_TB", { comment: "1:1 문의" } )
export class REPORT_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "유저아이디",
    } )
    public userId: number;

    @Column( {
        comment: "제목",
    } )
    public title: string;

    @Column( {
        comment: "내용",
        type: "text",
    } )
    public text: string;

    @Column( {
        comment: "답변",
        type: "text",
        nullable: true,
    } )
    public answer: string;

    @Column( {
        comment: "답변 날짜",
        type: "datetime",
        nullable: true,
    } )
    public answerAt: Date;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}