"""Korean VOC category-based keyword templates for rule-based analysis.

Mirrors the Backend 5대분류 × 17소분류 taxonomy defined in PromptTemplate.java.
Used as the primary matcher for Korean VOC text before falling back to
the technical log_templates.py system.
"""

from typing import Dict, List, Any, Tuple

VOC_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "오류/버그": {
        "keywords": [
            "오류", "에러", "버그", "안됨", "실패", "작동안함", "멈춤", "깨짐",
            "안돼", "안되", "못함", "안열림", "안나옴", "꺼짐", "다운", "중단",
            "500", "504", "에러코드", "오작동", "장애", "고장",
        ],
        "subcategories": {
            "시스템 오류": {
                "keywords": [
                    "서버", "접속", "다운", "504", "500", "502", "503",
                    "타임아웃", "로딩", "화이트스크린", "빈화면", "서비스중단",
                    "접속불가", "서버오류", "시스템장애", "무한로딩",
                ],
                "categoryCode": "ERROR_SYSTEM",
            },
            "UI/UX 오류": {
                "keywords": [
                    "버튼", "화면", "레이아웃", "깨짐", "안눌림", "터치",
                    "팝업", "메뉴", "스크롤", "모바일", "태블릿", "반응형",
                    "UI", "UX", "디자인", "표시", "겹침", "잘림",
                ],
                "categoryCode": "ERROR_UI",
            },
            "데이터 오류": {
                "keywords": [
                    "데이터", "유실", "사라짐", "삭제", "불일치", "안맞음",
                    "통계", "수치", "집계", "누락", "중복", "틀림",
                    "개인정보", "프로필", "정보오류", "필터오류",
                ],
                "categoryCode": "ERROR_DATA",
            },
            "결제 오류": {
                "keywords": [
                    "결제", "카드", "승인", "환불", "PG", "간편결제",
                    "이중결제", "중복청구", "결제실패", "결제오류",
                    "카카오페이", "네이버페이", "토스", "금액오류",
                ],
                "categoryCode": "ERROR_PAYMENT",
            },
        },
        "typical_responses": [
            "해당 오류 현상을 확인하고 긴급 수정 진행 중입니다.",
            "시스템 로그를 확인하여 근본 원인을 파악하겠습니다.",
            "재현 절차를 확인 후 빠르게 수정 패치를 배포하겠습니다.",
        ],
        "priority_signals": {
            "high": ["500", "504", "서버다운", "접속불가", "결제실패", "이중결제", "개인정보", "데이터유실"],
            "medium": ["화면깨짐", "버튼오류", "불일치", "통계오류", "필터오류"],
            "low": ["사소한", "가끔", "간헐적"],
        },
    },
    "기능 요청": {
        "keywords": [
            "추가", "요청", "기능", "개선", "개발", "만들어", "지원",
            "필요", "있으면", "좋겠", "바랍니다", "원합니다", "도입",
            "연동", "통합", "확장", "신규",
        ],
        "subcategories": {
            "신규 기능": {
                "keywords": [
                    "새로운", "신규", "추가", "개발해주", "만들어주",
                    "도입", "지원해주", "다크모드", "음성인식",
                    "AI", "자동화", "챗봇", "알림톡",
                ],
                "categoryCode": "FEATURE_NEW",
            },
            "기능 개선": {
                "keywords": [
                    "개선", "보완", "업그레이드", "수정", "변경",
                    "엑셀", "내보내기", "필터", "검색", "정렬",
                    "커스터마이징", "대시보드", "알림설정", "세분화",
                ],
                "categoryCode": "FEATURE_IMPROVE",
            },
            "시스템 연동": {
                "keywords": [
                    "연동", "통합", "API", "슬랙", "JIRA", "CRM",
                    "웹훅", "SSO", "외부시스템", "서드파티",
                ],
                "categoryCode": "FEATURE_INTEGRATION",
            },
        },
        "typical_responses": [
            "기능 요청을 접수하였으며, 제품 로드맵에 반영하여 검토하겠습니다.",
            "좋은 제안 감사합니다. 개발팀과 우선순위를 논의 후 일정을 안내드리겠습니다.",
        ],
        "priority_signals": {
            "high": ["업무마비", "필수", "시급", "긴급"],
            "medium": ["불편", "비효율", "수작업", "반복"],
            "low": ["있으면", "좋겠", "참고"],
        },
    },
    "문의": {
        "keywords": [
            "문의", "질문", "궁금", "어떻게", "방법", "알려주",
            "모르겠", "어디서", "언제", "확인", "가능한가",
            "안내", "설명", "도움", "가이드",
        ],
        "subcategories": {
            "사용 방법": {
                "keywords": [
                    "사용법", "사용방법", "매뉴얼", "가이드", "어떻게",
                    "방법", "절차", "순서", "등록방법", "출력",
                    "CSV", "업로드", "다운로드", "설정방법",
                ],
                "categoryCode": "INQUIRY_USAGE",
            },
            "계정 관련": {
                "keywords": [
                    "계정", "비밀번호", "아이디", "로그인", "권한",
                    "잠금", "해제", "탈퇴", "회원", "프로필",
                    "팀원", "부서", "접근권한", "인증",
                ],
                "categoryCode": "INQUIRY_ACCOUNT",
            },
            "결제/환불": {
                "keywords": [
                    "결제", "환불", "요금", "가격", "구독",
                    "청구", "세금계산서", "영수증", "카드",
                    "요금제", "업그레이드", "플랜",
                ],
                "categoryCode": "INQUIRY_PAYMENT",
            },
            "기타 문의": {
                "keywords": [
                    "기타", "일반", "이용약관", "개인정보",
                    "정책", "백업", "데이터", "API문서", "서비스안내",
                ],
                "categoryCode": "INQUIRY_ETC",
            },
        },
        "typical_responses": [
            "문의하신 내용에 대해 안내드리겠습니다.",
            "해당 기능의 사용 방법은 다음과 같습니다.",
        ],
        "priority_signals": {
            "high": ["긴급", "계정잠금", "접근불가"],
            "medium": ["환불", "결제", "권한변경"],
            "low": ["궁금", "문의", "안내"],
        },
    },
    "불만/개선": {
        "keywords": [
            "불만", "불편", "답답", "짜증", "화남", "실망",
            "개선", "느림", "느려", "오래걸", "기다림",
            "부족", "아쉬움", "불친절", "나쁨",
        ],
        "subcategories": {
            "서비스 불만": {
                "keywords": [
                    "서비스", "품질", "안정성", "장애", "잦은오류",
                    "기능변경", "공지없음", "불안정", "데이터유출",
                    "보안", "업데이트", "제한적",
                ],
                "categoryCode": "COMPLAINT_SERVICE",
            },
            "응대 불만": {
                "keywords": [
                    "상담원", "응대", "불친절", "태도", "전화",
                    "연결", "대기", "무시", "잘못된안내", "오안내",
                    "CS", "고객센터", "콜센터",
                ],
                "categoryCode": "COMPLAINT_STAFF",
            },
            "속도/성능": {
                "keywords": [
                    "느림", "느려", "속도", "성능", "로딩",
                    "지연", "버벅", "렉", "응답시간", "무거움",
                    "깜빡임", "새로고침", "업로드속도",
                ],
                "categoryCode": "COMPLAINT_PERFORMANCE",
            },
        },
        "typical_responses": [
            "불편을 드려 죄송합니다. 말씀하신 사항을 즉시 개선하겠습니다.",
            "소중한 피드백 감사합니다. 서비스 품질 향상에 반영하겠습니다.",
        ],
        "priority_signals": {
            "high": ["불친절", "서비스장애", "데이터유출", "개인정보", "업무지장"],
            "medium": ["느림", "불편", "기능제한", "대기시간"],
            "low": ["아쉬움", "참고"],
        },
    },
    "칭찬": {
        "keywords": [
            "감사", "좋아요", "만족", "최고", "훌륭", "칭찬",
            "친절", "감동", "추천", "편리", "유용", "잘되",
            "고맙", "감격",
        ],
        "subcategories": {
            "서비스 칭찬": {
                "keywords": [
                    "서비스", "기능", "시스템", "UI", "디자인",
                    "업데이트", "보고서", "분석", "편리", "유용",
                    "직관적", "효율", "자동화",
                ],
                "categoryCode": "PRAISE_SERVICE",
            },
            "직원 칭찬": {
                "keywords": [
                    "상담원", "담당자", "직원", "팀", "기술지원",
                    "친절", "빠른대응", "전문성", "꼼꼼", "세심",
                ],
                "categoryCode": "PRAISE_STAFF",
            },
        },
        "typical_responses": [
            "감사한 말씀 전해드리겠습니다. 더 좋은 서비스로 보답하겠습니다.",
            "칭찬의 말씀 감사합니다. 해당 직원에게 전달하겠습니다.",
        ],
        "priority_signals": {
            "high": [],
            "medium": [],
            "low": ["감사", "좋아요", "만족", "칭찬"],
        },
    },
}


def find_matching_voc_categories(text: str) -> List[Tuple[str, str, int]]:
    """Find VOC categories matching the given Korean text.

    Performs two-level matching: first major category, then subcategory.

    Args:
        text: Korean VOC text to analyze.

    Returns:
        List of (category, subcategory, match_count) tuples,
        sorted by match count descending.
    """
    text_lower = text.lower()
    matches: List[Tuple[str, str, int]] = []

    for category, info in VOC_TEMPLATES.items():
        # Check major category keywords
        cat_keywords = info.get("keywords", [])
        cat_match = sum(1 for kw in cat_keywords if kw in text_lower)

        if cat_match == 0:
            continue

        # Check subcategory keywords for finer classification
        subcategories = info.get("subcategories", {})
        best_sub = None
        best_sub_count = 0

        for sub_name, sub_info in subcategories.items():
            sub_keywords = sub_info.get("keywords", [])
            sub_match = sum(1 for kw in sub_keywords if kw in text_lower)
            if sub_match > best_sub_count:
                best_sub = sub_name
                best_sub_count = sub_match

        total_match = cat_match + best_sub_count
        subcategory = best_sub if best_sub else list(subcategories.keys())[0]
        matches.append((category, subcategory, total_match))

    return sorted(matches, key=lambda x: x[2], reverse=True)


def get_voc_category_info(category: str) -> Dict[str, Any]:
    """Get VOC template information for a specific major category.

    Args:
        category: Major category name (e.g., "오류/버그").

    Returns:
        Category template information or empty dict if not found.
    """
    return VOC_TEMPLATES.get(category, {})


def get_voc_priority(text: str, category: str) -> str:
    """Determine priority based on keywords in text for a VOC category.

    Args:
        text: VOC text to analyze.
        category: Major category to check priority signals for.

    Returns:
        Priority level: 'high', 'medium', or 'low'.
    """
    info = VOC_TEMPLATES.get(category, {})
    signals = info.get("priority_signals", {})
    text_lower = text.lower()

    for priority in ["high", "medium", "low"]:
        keywords = signals.get(priority, [])
        if any(kw in text_lower for kw in keywords):
            return priority

    return "medium"


def get_category_code(category: str, subcategory: str) -> str:
    """Get the category code for a given category + subcategory pair.

    Args:
        category: Major category name.
        subcategory: Subcategory name.

    Returns:
        Category code string (e.g., "ERROR_PAYMENT") or "UNKNOWN".
    """
    info = VOC_TEMPLATES.get(category, {})
    sub_info = info.get("subcategories", {}).get(subcategory, {})
    return sub_info.get("categoryCode", "UNKNOWN")
