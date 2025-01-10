import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";

@Entity( "TC_NOTICE_TB", { comment: "공지" } )
export class NOTICE_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "제목",
    } )
    public title: string;

    @Column( {
        comment: "내용",
        type: "longtext",
    } )
    public text: string;

    @Column( {
        comment: "상태, 1=노출, 9=삭제",
        default: 1
    } )
    public status: number;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}