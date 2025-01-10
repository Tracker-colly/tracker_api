import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique, ManyToMany } from "typeorm";

type EvalDataType = {
    title: string
    child: {
        title: string
        message: string
        point: number
    }[]
}
@Entity( "TC_INSA_TB", { comment: "인사평가" } )
export class INSA_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "상태 1=요청, 2=완료, 9=삭제"
    } )
    public status: number;

    @Column( {
        comment: "유저",
    } )
    public userId: number;

    @Column( {
        comment: "회사 아이디",
        nullable: false
    } )
    public companyId: number;

    @Column( {
        comment: "회사명",
        nullable: true
    } )
    public companyName: string;

    @Column( {
        comment: "근무시작년",
        nullable: true
    } )
    public startYear: string;

    @Column( {
        comment: "근무시작월",
        nullable: true
    } )
    public startMonth: string;

    @Column( {
        comment: "근무종료년",
        nullable: true
    } )
    public endYear: string;

    @Column( {
        comment: "근무종료월",
        nullable: true
    } )
    public endMonth: string;

    @Column( {
        comment: "근무유형",
        nullable: true
    } )
    public workType: string;

    @Column( {
        comment: "근무직책",
        nullable: true
    } )
    public workLevel: string;

    @Column( {
        comment: "작성자",
    } )
    public creatorId: number;

    @Column( {
        comment: "작성자 관계",
        default: "선임/상사",
    } )
    public creatorRelation: string;

    @Column( {
        comment: "작성자 직책",
        nullable: true
    } )
    public creatorWorkLevel: number;

    @Column( {
        comment: "평가 데이터",
        type: "json",
    } )
    public evalData: EvalDataType[];

    @Column( {
        comment: "종합 평가",
        nullable: true
    } )
    public pointFinal: number;

    @Column( {
        comment: "의견",
        type: "text",
        nullable: true
    } )
    public comment: string;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}