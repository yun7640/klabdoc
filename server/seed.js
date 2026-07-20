'use strict';
/**
 * 기본 사용자 시드.
 * K-LabDoc 프론트엔드의 USERS 구성과 동일하게 맞춘다.
 * 최초 배포 시 모든 계정의 기본 PIN은 "0000" 이며,
 * 운영 전 반드시 변경(마이페이지 또는 관리자 추가)해야 한다.
 */
const DEFAULT_PIN = process.env.DEFAULT_PIN || '0000';

const SEED_USERS = [
  { id: 'u1', name: '윤_진단', role: '담당 전문의',  group: '전문의' },
  { id: 'u4', name: '서_진단', role: '담당 전문의',  group: '전문의' },
  { id: 'u7', name: '하_진단', role: '담당 전문의',  group: '전문의' },
  { id: 'u2', name: '최_파트', role: '파트장 병리사', group: '임상병리사' },
  { id: 'u3', name: '손_담당', role: '검사 담당자',  group: '임상병리사' },
  { id: 'u5', name: '김_담당', role: '검사 담당자',  group: '임상병리사' },
  { id: 'u6', name: '유_담당', role: '검사 담당자',  group: '임상병리사' },
  { id: 'admin', name: '관리자', role: '담당 전문의', group: '전문의' }
];

module.exports = { SEED_USERS, DEFAULT_PIN };

if (require.main === module && process.argv.includes('--print')) {
  console.log(JSON.stringify({ DEFAULT_PIN, SEED_USERS }, null, 2));
}
