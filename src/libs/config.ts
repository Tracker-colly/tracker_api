import { InboxType } from "./types";

export enum RES_CODE
{
    OK = 1,
    ACCESS_DENIED = 1000,
    EXCEPTION = 9000,
}

export const OptionData = {
    workTypes: ["회사", "알바", "프리랜서"],
    relations: ["후임", "선임/상사", "동기", "동료"],
    workLevels: ["대표자", "임원진", "팀장급", "중간관리자", "실무관리자", "인턴", "기타"],
    codes: [
        { id: 9, value: "대표자" },
        { id: 7, value: "이사" },
        { id: 6, value: "부장" },
        { id: 5, value: "차장" },
        { id: 4, value: "과장" },
        { id: 3, value: "대리" },
        { id: 2, value: "주임" },
        { id: 1, value: "사원" },
    ],
    pointFinals: [
        { id: 1, title: "채용 결정에 고민을 하겠습니다." },
        { id: 2, title: "타 지원자와 동등한 조건이라면 채용하겠습니다." },
        { id: 3, title: "우수하므로 채용하겠습니다." },
        { id: 4, title: "어떤 상황이라도 반드시 채용하겠습니다." },
        { id: 5, title: "채용하지 않겠습니다." }
    ],
    pointInsaFinals: [
        { id: 1, title: "우수하다" },
        { id: 2, title: "좋다" },
        { id: 3, title: "만족스럽다" },
        { id: 4, title: "개선이 필요하다" },
        { id: 5, title: "불만족스럽다" }
    ]
}

export const codeToStr = ( id: number ) =>
{
    let data = OptionData.codes.find( v => v.id == id );
    if ( data )
        return data.value;
    else
        return id.toString();
}

export const defaultDoc = [
    {
        title: "태도 및 윤리 의식",
        child: [
            {
                title: "근무태도",
                message: "올바른 인성을 갖추고 조직의 구성원으로서의 기본 적인 태도를 유지하고 있나요?(인사성, 사교성, 긍정성, 도덕성)"
            },
            {
                title: "성실성",
                message: "성실한 자세로 업무에 임하고 있나요?(지각, 조퇴, 결근의 빈도)"
            },
            {
                title: "책임감",
                message: "맡은 일을 책임감있게 수행하고 그 결과에 대해 책임지는 태도는 어떠한가요?"
            },
            {
                title: "협동심",
                message: "상사의 지시 사항을 잘 수행하고, 팀원과의 팀워크를 형성하는데 적극적인가요?"
            }
        ],
    },
    {
        title: "능력",
        child: [
            {
                title: "업무지식",
                message: "담당 직무에 대한 지식과 관련 업무 분야에 대한 지식의 정도는 어떠한가요?"
            },
            {
                title: "생산성",
                message: "주어진 시간 안에 맡은 일의 우선순위를 정하여 효율적으로 완료하는 능력은 어떠한가요?"
            },
            {
                title: "분석판단력",
                message: "계획 지시된 업무의 문제점을 적극적으로 파악하고 분석하며 건설적 해결책과 대책을 강구하는 능력은 어떠한가요?"
            },
            {
                title: "의사소통능력",
                message: "상사 및 팀원들, 이해관계자들과의 원활한 소통으로 유대관계를 유지하는 능력은 어떠한가요?"
            },
            {
                title: "리더쉽",
                message: "적극적인 자세로 팀의 목표 설정 및 수립을 위해 의견을 제시하거나 수렴하고 팀을 잘 끌고 나가나요?"
            },
            {
                title: "자기계발",
                message: "업무에 필요한 새로운 기술이나 지식을 배우는 노력은 어떠한가요?"
            }
        ],
    },
    {
        title: "업무 실적",
        child: [
            {
                title: "업무 달성",
                message: "계획, 지시에 의해 부과된 업무의 달성 여부, 타 직원과의 업무량 수준 및 기간 내 달성 여부는 어떠한가요?"
            },
            {
                title: "업무의 질",
                message: "착오, 누락, 오류의 발생 빈도를 최소화 하고 업무 속도가 빠르면서 완성도를 높이는 능력은 어떠한가요?"
            },
            {
                title: "업무 개선",
                message: "업무 성과 향상을 위한 혁신적인 방법 (프로세스 개선, 새로운 아이디어 도입, 제도 변화 등) 모색 및 실행의 기여도는 어떠한가요?"
            },
            {
                title: "업무 처리",
                message: "업무 수행 시 기준이나 절차를 준수하며 조직의 핵심 가치(고객 중심 등)를 구현하는 능력은 어떠한가요?"
            },
            {
                title: "업무 평가",
                message: "업무 수행에 대한 상사, 동료, 고객으로부터의 평가는 어떠한가요?"
            }
        ],
    }
]

export enum AuthNumType
{
    registe = 1,
    findPass = 2,
    changePass = 3,
}

export const limitCheckTime = 300;

/**
 * 현재시간 대비 유효시간 가져오기
 * @returns 
 */
export const authCheckTime = () => Date.now() - ( limitCheckTime * 1000 )

