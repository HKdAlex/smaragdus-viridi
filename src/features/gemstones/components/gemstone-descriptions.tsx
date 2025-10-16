import { Award, BookOpen, Languages } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";

interface GemstoneDescriptionsProps {
  technicalRu: string | null;
  technicalEn: string | null;
  emotionalRu: string | null;
  emotionalEn: string | null;
  narrativeRu: string | null;
  narrativeEn: string | null;
  locale?: string;
}

/**
 * User-facing gemstone descriptions component
 * Displays technical, emotional, and narrative descriptions in tabs
 * Automatically selects correct language based on locale
 */
export function GemstoneDescriptions({
  technicalRu,
  technicalEn,
  emotionalRu,
  emotionalEn,
  narrativeRu,
  narrativeEn,
  locale = "ru",
}: GemstoneDescriptionsProps) {
  // Show nothing if no descriptions available
  if (!technicalRu && !emotionalRu && !narrativeRu) {
    return null;
  }

  const isRussian = locale === "ru";
  const technical = isRussian ? technicalRu : technicalEn;
  const emotional = isRussian ? emotionalRu : emotionalEn;
  const narrative = isRussian ? narrativeRu : narrativeEn;

  return (
    <Card data-testid="gemstone-descriptions">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          {isRussian ? "Описания" : "Descriptions"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="emotional" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="emotional"
              className="text-sm"
              data-tab="emotional"
            >
              <Award className="w-4 h-4 mr-2" />
              {isRussian ? "Описание" : "Description"}
            </TabsTrigger>
            <TabsTrigger
              value="technical"
              className="text-sm"
              data-tab="technical"
            >
              {isRussian ? "Технические" : "Technical"}
            </TabsTrigger>
            <TabsTrigger
              value="narrative"
              className="text-sm"
              data-tab="narrative"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {isRussian ? "История" : "Story"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emotional" className="mt-4">
            <div className="prose prose-sm max-w-none">
              {emotional ? (
                <p className="text-base leading-relaxed">{emotional}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  {isRussian
                    ? "Описание скоро появится"
                    : "Description coming soon"}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="technical" className="mt-4">
            <div className="prose prose-sm max-w-none">
              {technical ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {technical}
                </p>
              ) : (
                <p className="text-muted-foreground italic">
                  {isRussian
                    ? "Техническое описание скоро появится"
                    : "Technical description coming soon"}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="narrative" className="mt-4">
            <div className="prose prose-sm max-w-none">
              {narrative ? (
                <div className="text-center py-6">
                  <p className="text-base leading-loose font-serif text-foreground/90">
                    {narrative}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  {isRussian
                    ? "История камня скоро появится"
                    : "Stone story coming soon"}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
