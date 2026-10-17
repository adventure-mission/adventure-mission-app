'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedQuestsNewPage() {
  const router = useRouter();

  useEffect(() => {
    // 「予定を設定する」は「予定を追加する（/quest/new）」へ統合されたためリダイレクト
    router.replace('/quest/new?from=dashboard');
  }, [router]);

  return null;
}
