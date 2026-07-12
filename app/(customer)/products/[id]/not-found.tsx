import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 p-6">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>ไม่พบสินค้า</CardTitle>
          <CardDescription>สินค้านี้อาจถูกลบหรือไม่มีในระบบ</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button render={<Link href="/" />}>กลับแคตตาล็อก</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
