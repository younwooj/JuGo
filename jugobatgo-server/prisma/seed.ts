import { PrismaClient, TransactionType, Category } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 데이터베이스 시딩 시작...');

  // 1. 테스트 사용자 생성
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      socialProvider: 'KAKAO',
    },
  });
  console.log('✅ 사용자 생성:', user.email);

  // 2. 장부 그룹 생성
  const groups = await Promise.all([
    prisma.ledgerGroup.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        userId: user.id,
        name: '회사 동료',
      },
    }),
    prisma.ledgerGroup.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        userId: user.id,
        name: '친구',
      },
    }),
    prisma.ledgerGroup.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        userId: user.id,
        name: '가족',
      },
    }),
  ]);
  console.log('✅ 장부 그룹 생성:', groups.map(g => g.name).join(', '));

  // 3. 연락처 생성
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { id: '00000000-0000-0000-0000-000000000011' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000011',
        userId: user.id,
        name: '김철수',
        phoneNumber: '010-1234-5678',
        ledgerGroupId: groups[0].id, // 회사 동료
      },
    }),
    prisma.contact.upsert({
      where: { id: '00000000-0000-0000-0000-000000000012' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000012',
        userId: user.id,
        name: '이영희',
        phoneNumber: '010-2345-6789',
        ledgerGroupId: groups[1].id, // 친구
      },
    }),
    prisma.contact.upsert({
      where: { id: '00000000-0000-0000-0000-000000000013' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000013',
        userId: user.id,
        name: '박민수',
        phoneNumber: '010-3456-7890',
        ledgerGroupId: groups[2].id, // 가족
      },
    }),
    prisma.contact.upsert({
      where: { id: '00000000-0000-0000-0000-000000000014' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000014',
        userId: user.id,
        name: '최지훈',
        phoneNumber: '010-4567-8901',
        ledgerGroupId: groups[0].id, // 회사 동료
      },
    }),
    prisma.contact.upsert({
      where: { id: '00000000-0000-0000-0000-000000000015' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000015',
        userId: user.id,
        name: '정수진',
        phoneNumber: '010-5678-9012',
        ledgerGroupId: groups[1].id, // 친구
      },
    }),
  ]);
  console.log('✅ 연락처 생성:', contacts.map(c => c.name).join(', '));

  // 4. 거래 내역 생성
  const transactions = await Promise.all([
    // 김철수에게 준 것 (결혼식)
    prisma.transaction.create({
      data: {
        contactId: contacts[0].id,
        ledgerGroupId: groups[0].id,
        type: TransactionType.GIVE,
        category: Category.CASH,
        amount: 100000,
        originalName: '결혼식 축의금',
        eventDate: new Date('2026-01-05'),
        memo: '결혼 축하드립니다!',
      },
    }),
    // 이영희에게 받은 것 (생일)
    prisma.transaction.create({
      data: {
        contactId: contacts[1].id,
        ledgerGroupId: groups[1].id,
        type: TransactionType.RECEIVE,
        category: Category.GIFT,
        amount: 50000,
        originalName: '생일 선물',
        eventDate: new Date('2026-01-08'),
        memo: '생일 축하 선물',
      },
    }),
    // 박민수에게 준 것 (장례식)
    prisma.transaction.create({
      data: {
        contactId: contacts[2].id,
        ledgerGroupId: groups[2].id,
        type: TransactionType.GIVE,
        category: Category.CASH,
        amount: 200000,
        originalName: '장례식 조의금',
        eventDate: new Date('2026-01-03'),
        memo: '삼가 고인의 명복을 빕니다',
      },
    }),
    // 최지훈에게 준 것
    prisma.transaction.create({
      data: {
        contactId: contacts[3].id,
        ledgerGroupId: groups[0].id,
        type: TransactionType.GIVE,
        category: Category.CASH,
        amount: 50000,
        originalName: '돌잔치',
        eventDate: new Date('2025-12-20'),
        memo: '아기 돌 축하',
      },
    }),
    // 정수진에게 받은 것
    prisma.transaction.create({
      data: {
        contactId: contacts[4].id,
        ledgerGroupId: groups[1].id,
        type: TransactionType.RECEIVE,
        category: Category.CASH,
        amount: 100000,
        originalName: '생일 축하금',
        eventDate: new Date('2025-12-15'),
        memo: '생일 축하',
      },
    }),
    // 김철수에게 받은 것 (과거)
    prisma.transaction.create({
      data: {
        contactId: contacts[0].id,
        ledgerGroupId: groups[0].id,
        type: TransactionType.RECEIVE,
        category: Category.CASH,
        amount: 50000,
        originalName: '내 결혼식 축의금',
        eventDate: new Date('2025-06-10'),
        memo: '결혼식에 와주셔서 감사합니다',
      },
    }),
  ]);
  console.log('✅ 거래 내역 생성:', transactions.length, '건');

  console.log('🎉 시딩 완료!');
  console.log('📊 요약:');
  console.log('  - 사용자: 1명');
  console.log('  - 장부 그룹: 3개');
  console.log('  - 연락처: 5명');
  console.log('  - 거래 내역: 6건');
}

main()
  .catch((e) => {
    console.error('❌ 시딩 에러:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
