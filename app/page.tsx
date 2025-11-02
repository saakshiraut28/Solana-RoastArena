/** @format */

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const cardData = [
  {
    id: 1,
    title: "Creative Design",
    description: "Build stunning interfaces",
    content:
      "Explore modern design patterns and create beautiful user experiences with cutting-edge technologies.",
    laughs: "23",
  },
  {
    id: 2,
    title: "Fast Performance",
    description: "Optimized for speed",
    content:
      "Lightning-fast loading times and smooth interactions that keep your users engaged and happy.",
    laughs: "23",
  },
  {
    id: 3,
    title: "Scalable Solutions",
    description: "Grow with confidence",
    content:
      "Build applications that grow with your business, from startup to enterprise-level deployment.",
    laughs: "23",
  },
  {
    id: 4,
    title: "Developer Friendly",
    description: "Easy integration",
    content:
      "Intuitive APIs and comprehensive documentation make it easy for developers to get started quickly.",
    laughs: "23",
  },
  {
    id: 5,
    title: "Real-time Updates",
    description: "Live collaboration",
    content:
      "Sync data across devices instantly with real-time capabilities that just work out of the box.",
    laughs: "23",
  },
  {
    id: 6,
    title: "Security First",
    description: "Protect your data",
    content:
      "Enterprise-grade security with encryption, compliance, and industry best practices built-in.",
    laughs: "23",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-7xl flex-col items-center justify-start py-12 lg:py-20 px-4 md:px-8 lg:px-16 bg-white dark:bg-black">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Amazing Features
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore what makes our platform special
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cardData.map((card) => (
            <Card key={card.id} className={`flex flex-col`}>
              <CardHeader className="flex-shrink-0">
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p>{card.content}</p>
              </CardContent>
              <CardFooter className="flex-shrink-0 pt-4">
                <p className="text-sm font-medium text-primary hover:underline cursor-pointer">
                 🤣 {card.laughs}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
