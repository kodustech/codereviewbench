import { redirect } from 'next/navigation';

export default function HeavyCompareIndex() {
  redirect('/compare?mode=heavy');
}
