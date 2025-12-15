import { supabase } from "@/integrations/supabase/client";

export async function seedSampleData() {
  // Check if we already have data
  const { data: existingBoards } = await supabase
    .from("agent_boards")
    .select("id")
    .limit(1);

  if (existingBoards && existingBoards.length > 0) {
    console.log("Sample data already exists");
    return;
  }

  // Create sample Agent Board
  const { data: board, error: boardError } = await supabase
    .from("agent_boards")
    .insert({
      name: "Black Friday - US Campaign",
      description: "High-converting Black Friday promotional campaign targeting US audience",
      goal: "Drive 10,000 conversions with target CPA under $15",
      budget_cap_note: "$5,000 daily budget",
      creative_style_notes: "Bold, urgent messaging with countdown elements. Use black/gold color scheme. Focus on scarcity and limited-time offers.",
    })
    .select()
    .single();

  if (boardError) {
    console.error("Error creating sample board:", boardError);
    return;
  }

  // Create sample creative cards
  const sampleCards = [
    {
      agent_board_id: board.id,
      title: "Black Friday Flash Sale - 70% Off",
      headline: "Black Friday Flash Sale",
      primary_text: "Don't miss out! 70% off everything for 24 hours only. Limited stock available.",
      description_text: "Shop now and save big on your favorite products",
      tags: ["Black Friday", "Flash Sale", "Urgency"],
      status: "AI_DRAFT",
    },
    {
      agent_board_id: board.id,
      title: "Doorbuster Deal - Free Shipping",
      headline: "Doorbuster Deal Alert",
      primary_text: "Black Friday exclusive: 60% off + FREE shipping on all orders. No code needed!",
      description_text: "Limited quantities available",
      tags: ["Black Friday", "Free Shipping", "Doorbuster"],
      status: "AI_DRAFT",
    },
    {
      agent_board_id: board.id,
      title: "Last Chance - Ending Tonight",
      headline: "Last Chance! Ends Tonight",
      primary_text: "Final hours! Black Friday deals ending at midnight. Save up to 75% while supplies last.",
      description_text: "Shop the biggest sale of the year",
      tags: ["Black Friday", "Last Chance", "Countdown"],
      status: "REVIEWED",
    },
    {
      agent_board_id: board.id,
      title: "Premium Bundle - Best Value",
      headline: "Black Friday Premium Bundle",
      primary_text: "Get our premium bundle at 65% off. Best value of the year, guaranteed.",
      description_text: "Includes everything you need plus exclusive bonuses",
      tags: ["Black Friday", "Bundle", "Value"],
      status: "READY_TO_LAUNCH",
    },
  ];

  const { error: cardsError } = await supabase
    .from("creative_cards")
    .insert(sampleCards);

  if (cardsError) {
    console.error("Error creating sample cards:", cardsError);
    return;
  }

  // Create sample assets
  const sampleAssets = [
    {
      name: "Black Friday Logo",
      type: "image",
      tags: ["branding", "Black Friday"],
      niche_tag: "Niche 1",
    },
    {
      name: "Headline Template - Urgency",
      type: "text",
      text_content: "Only {X} hours left! Don't miss {OFFER}",
      tags: ["template", "urgency"],
    },
    {
      name: "Brand Guidelines Doc",
      type: "doc",
      url_or_path: "https://example.com/brand-guidelines.pdf",
      tags: ["branding", "guidelines"],
    },
  ];

  const { error: assetsError } = await supabase
    .from("assets")
    .insert(sampleAssets);

  if (assetsError) {
    console.error("Error creating sample assets:", assetsError);
    return;
  }

  // Create sample prompt templates
  const samplePrompts = [
    {
      name: "Black Friday Ad Copy",
      content:
        "Generate 5 Black Friday ad variations focusing on {ANGLE} for {PRODUCT}. Use urgent, action-oriented language. Include discount percentage and time limitation.",
      tags: ["Black Friday", "urgency", "sales"],
    },
    {
      name: "Product Benefits Focus",
      content:
        "Create ad copy highlighting the top 3 benefits of {PRODUCT} for {TARGET_AUDIENCE}. Focus on transformation and results.",
      tags: ["benefits", "transformation"],
    },
  ];

  const { error: promptsError } = await supabase
    .from("prompt_templates")
    .insert(samplePrompts);

  if (promptsError) {
    console.error("Error creating sample prompts:", promptsError);
    return;
  }

  console.log("Sample data created successfully!");
}
