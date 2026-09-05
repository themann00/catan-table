import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderProps {
  title: string;
  description: string;
  tier: number;
}

/** Stand-in for a tab that lands in a later tier. Removed as tabs ship. */
export const Placeholder = ({ title, description, tier }: PlaceholderProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">Coming in tier {tier}.</p>
    </CardContent>
  </Card>
);
