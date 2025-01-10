import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";

@Entity( "TC_FAQ_TB", { comment: "자주하는 질문" } )
export class FAQ_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "카테고리",
        default: "일반"
    } )
    public category: string;

    @Column( {
        comment: "제목",
    } )
    public title: string;

    @Column( {
        comment: "내용",
        type: "text",
    } )
    public text: string;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}