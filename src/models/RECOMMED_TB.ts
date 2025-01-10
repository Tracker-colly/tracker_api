import { Entity, BeforeInsert, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, Index, Unique, Stream } from "typeorm";

@Entity( "TC_RECOMMED_TB", { comment: "추천서" } )
export class RECOMMED_TB extends BaseEntity
{
    @PrimaryGeneratedColumn()
    public idx: number;

    @Column( {
        comment: "상태 1=요청, 2=완료, 9=삭제"
    } )
    public status: number;

    @Column( {
        comment: "유저",
        nullable: true,
    } )
    public userId: number;

    @Column( {
        comment: "회사 아이디(없을수 있음)",
        nullable: true
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
        comment: "작성자 (id 없을수 있음)",
        nullable: true,
    } )
    public creatorId: number;

    @Column( {
        comment: "작성자 이메일 (id 가 없을경우)",
        nullable: true,
    } )
    public creatorEmail: string;

    @Column( {
        comment: "작성자 증빙파일",
        type: "text",
        nullable: true,
    } )
    public creatorFile: string;

    @Column( {
        comment: "작성자 관계",
        nullable: true,
    } )
    public creatorRelation: string;

    @Column( {
        comment: "작성자 직책",
        nullable: true
    } )
    public creatorWorkLevel: number;

    @Column( {
        comment: "성실성 1-5",
        nullable: true
    } )
    public pointIntegrity: number;

    @Column( {
        comment: "책임감 1-5",
        nullable: true
    } )
    public pointResponsibility: number;

    @Column( {
        comment: "팀워크 1-5",
        nullable: true
    } )
    public pointTeamwork: number;

    @Column( {
        comment: "담당업무 1-5",
        nullable: true
    } )
    public pointWork: number;

    @Column( {
        comment: "업무스킬 1-5",
        nullable: true
    } )
    public pointSkill: number;

    @Column( {
        comment: "윤리 및 태도",
        nullable: true
    } )

    public pointAttitude: boolean;
    @Column( {
        comment: "윤리적 문제",
        nullable: true
    } )
    public pointProblems: boolean;
    @Column( {
        comment: "주변인과의 관계",
        nullable: true
    } )
    public pointRelationships: boolean;

    @Column( {
        comment: "강점",
        nullable: true,
        type: "text"
    } )
    public pointBest: string;

    @Column( {
        comment: "개선점",
        nullable: true,
        type: "text"
    } )
    public pointWorst: string;

    @Column( {
        comment: "채용여부 1-5",
        nullable: true,
        type: "text"
    } )
    public pointFinal: number;

    @CreateDateColumn( {
        type: "datetime"
    } )
    public createAt: Date;

    @UpdateDateColumn( {
        type: "datetime"
    } )
    public updateAt: Date;
}