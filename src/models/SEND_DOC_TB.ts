import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique } from "typeorm";
type EvalDataType = {
    title: string
    child: {
        title: string
        message: string
        point: number
    }[]
}
@Entity( "TC_SEND_DOC_TB", { comment: "제출한 리스트" } )
export class SEND_DOC_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "제출 유저",
    } )
    public userId: number;

    @Column( {
        comment: "제출한 회사",
    } )
    public companyId: number;

    @Column( {
        comment: "인사평가",
    } )
    public insaId: number;

    @Column( {
        comment: "확인",
        default: false
    } )
    public isView: boolean;

    @Column( {
        comment: "추천서 리스트",
        type: "json"
    } )
    public recommendIds: number[];

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}