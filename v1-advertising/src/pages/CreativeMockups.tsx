import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image, FileText, Brain, MessageSquare, Download, Link2, Check, RefreshCw, List, Layers, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const CreativeMockups = () => {
  const [expandedDock, setExpandedDock] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Creatives Node Design Concepts</h1>
          <p className="text-lg text-muted-foreground">Visual mockups for the new Creatives processing block with input/output handles and internal gallery</p>
        </div>

        {/* RECOMMENDED HYBRID DESIGN */}
        <Card className="p-8 space-y-6 bg-card border-2 border-primary shadow-2xl">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground">RECOMMENDED</Badge>
              <h2 className="text-3xl font-bold text-foreground">Hybrid: Expandable Channel-Adaptive Gallery</h2>
            </div>
            <p className="text-muted-foreground">Combines dock-style expandability (#5) with channel-aware display modes (#2). Auto-detects content type and renders optimal preview format.</p>
          </div>

          {/* Collapsed State */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ChevronDown className="w-5 h-5 text-primary" />
              Collapsed State (Dock Mode)
            </h3>
            <div className="flex justify-center py-6 bg-muted/30 rounded-lg">
              <div className="relative w-[280px] h-[60px] rounded-lg border-2 bg-card shadow-lg border-border hover:border-primary transition-colors cursor-pointer">
                {/* Left Input Indicators */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 -translate-x-1/2">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-accent" title="Media Connected" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary" title="Copy Connected" />
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-muted bg-muted/20" title="Brain Not Connected" />
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary border-2 border-secondary" title="Offer Connected" />
                </div>

                {/* Content */}
                <div className="px-4 h-full flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Creative Factory</span>
                  <Badge variant="secondary" className="ml-auto">4 variants</Badge>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Expanded State - All 4 Display Modes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ChevronUp className="w-5 h-5 text-primary" />
              Expanded State (Channel-Adaptive Display Modes)
            </h3>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Mode A: Google Ads (Text-Only) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Mode A</Badge>
                  <span className="text-sm font-semibold text-foreground">Google Ads (Text-Only)</span>
                </div>
                <div className="relative w-full h-[360px] rounded-lg border-2 bg-card shadow-lg border-border">
                  {/* Input Handles */}
                  <div className="absolute left-0 top-8 flex flex-col gap-3 -translate-x-1/2">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-muted bg-muted/20" title="Media" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary" title="Copy" />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-muted bg-muted/20" title="Brain" />
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary border-2 border-secondary" title="Offer" />
                  </div>

                  <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Google Ads</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">← Prev</Button>
                        <Badge variant="secondary" className="text-xs">1 / 4</Badge>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">Next →</Button>
                      </div>
                    </div>

                    <div className="flex-1 bg-muted/30 rounded-lg p-3 space-y-2 overflow-y-auto">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Headlines</span>
                        <div className="bg-card rounded p-2 border border-border">
                          <p className="text-sm text-foreground">Get 50% Off Premium Plans Today</p>
                        </div>
                        <div className="bg-card rounded p-2 border border-border">
                          <p className="text-sm text-foreground">Limited Time: Half Price Premium</p>
                        </div>
                        <div className="bg-card rounded p-2 border border-border">
                          <p className="text-sm text-foreground">Save Big on Your Subscription Now</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Descriptions</span>
                        <div className="bg-card rounded p-2 border border-border">
                          <p className="text-xs text-foreground">Upgrade to premium and unlock all features. Limited offer.</p>
                        </div>
                        <div className="bg-card rounded p-2 border border-border">
                          <p className="text-xs text-foreground">Join thousands of satisfied users. Start your free trial today.</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Display URL</span>
                        <div className="bg-card rounded p-2 border border-border">
                          <p className="text-xs font-mono text-primary">www.example.com/offers/premium</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">Push to Review</Button>
                      <Button size="sm" variant="secondary" className="flex-1">Push to Next</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode B: TikTok Script (Short-Form) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-pink-500/10 text-pink-600 border-pink-500/30">Mode B</Badge>
                  <span className="text-sm font-semibold text-foreground">TikTok Script (Short-Form)</span>
                </div>
                <div className="relative w-full h-[360px] rounded-lg border-2 bg-card shadow-lg border-border">
                  {/* Input Handles */}
                  <div className="absolute left-0 top-8 flex flex-col gap-3 -translate-x-1/2">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-accent" title="Media" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary" title="Copy" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted border-2 border-muted/50" title="Brain" />
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary border-2 border-secondary" title="Offer" />
                  </div>

                  <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">TikTok Script</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">← Prev</Button>
                        <Badge variant="secondary" className="text-xs">2 / 4</Badge>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">Next →</Button>
                      </div>
                    </div>

                    <div className="flex-1 bg-muted/30 rounded-lg p-3 space-y-3 overflow-y-auto">
                      <div className="bg-accent/20 border-l-4 border-accent rounded p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-accent uppercase">Hook</span>
                          <Badge variant="outline" className="text-xs">0-3s</Badge>
                        </div>
                        <p className="text-sm text-foreground">"Wait, you're still paying full price?"</p>
                      </div>

                      <div className="bg-primary/10 border-l-4 border-primary rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary uppercase">Body</span>
                          <Badge variant="outline" className="text-xs">3-12s</Badge>
                        </div>
                        <div className="space-y-2 text-xs text-foreground">
                          <div className="flex gap-2">
                            <span className="text-muted-foreground">S1:</span>
                            <p>Show shocked reaction to price tag</p>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground">S2:</span>
                            <p>Reveal 50% off code on screen</p>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground">S3:</span>
                            <p>Quick demo of premium features</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-secondary/20 border-l-4 border-secondary rounded p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-secondary uppercase">CTA</span>
                          <Badge variant="outline" className="text-xs">12-15s</Badge>
                        </div>
                        <p className="text-sm text-foreground">"Link in bio - don't miss out!"</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">Push to Review</Button>
                      <Button size="sm" variant="secondary" className="flex-1">Push to Next</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode C: Facebook Visual Grid */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-600/10 text-blue-700 border-blue-600/30">Mode C</Badge>
                  <span className="text-sm font-semibold text-foreground">Facebook/IG (Visual + Copy)</span>
                </div>
                <div className="relative w-full h-[360px] rounded-lg border-2 bg-card shadow-lg border-border">
                  {/* Input Handles */}
                  <div className="absolute left-0 top-8 flex flex-col gap-3 -translate-x-1/2">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-accent" title="Media" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary" title="Copy" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted border-2 border-muted/50" title="Brain" />
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary border-2 border-secondary" title="Offer" />
                  </div>

                  <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">FB/IG Ads</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">6 variants</Badge>
                    </div>

                    <div className="flex-1 bg-muted/30 rounded-lg p-3 space-y-3 overflow-y-auto">
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="relative aspect-square bg-background rounded border-2 border-border hover:border-primary transition-colors cursor-pointer flex items-center justify-center group">
                            <Image className="w-6 h-6 text-muted-foreground" />
                            <div className="absolute top-1 right-1 w-4 h-4 rounded border-2 border-border bg-card group-hover:border-primary transition-colors" />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase">Primary Text</span>
                          <p className="text-xs text-foreground bg-card rounded p-2 border border-border">
                            🎉 Limited time offer! Get 50% off premium plans. Don't miss out on this incredible deal.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Headline</span>
                            <p className="text-xs text-foreground bg-card rounded p-1.5 border border-border">Save 50% Now</p>
                          </div>
                          <div className="flex-1 space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase">CTA</span>
                            <Badge className="w-full justify-center bg-primary">Shop Now</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="text-xs">Select All</Button>
                      <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">Push Selected to Review</Button>
                      <Button size="sm" variant="secondary" className="flex-1">Push to Next</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode D: Carousel/Mixed */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">Mode D</Badge>
                  <span className="text-sm font-semibold text-foreground">Carousel/Mixed Content</span>
                </div>
                <div className="relative w-full h-[360px] rounded-lg border-2 bg-card shadow-lg border-border">
                  {/* Input Handles */}
                  <div className="absolute left-0 top-8 flex flex-col gap-3 -translate-x-1/2">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-accent" title="Media" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary" title="Copy" />
                    <div className="w-2.5 h-2.5 rounded-full bg-muted border-2 border-muted/50" title="Brain" />
                    <div className="w-2.5 h-2.5 rounded-full bg-secondary border-2 border-secondary" title="Offer" />
                  </div>

                  <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Carousel</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">5 cards</Badge>
                    </div>

                    <div className="flex-1 bg-muted/30 rounded-lg p-3 space-y-3 overflow-y-auto">
                      {/* Large Preview of Current Card */}
                      <div className="bg-background rounded-lg border-2 border-primary p-4 space-y-2">
                        <div className="aspect-[4/3] bg-muted rounded flex items-center justify-center">
                          <Image className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground">Card 2: Premium Features</p>
                          <p className="text-xs text-muted-foreground">Unlock advanced analytics, priority support, and more.</p>
                        </div>
                      </div>

                      {/* Navigation Dots */}
                      <div className="flex justify-center gap-1.5">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                              i === 1 ? 'bg-primary w-6' : 'bg-muted hover:bg-muted-foreground/50'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Thumbnails */}
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div 
                            key={i} 
                            className={`flex-shrink-0 w-16 h-16 rounded border-2 ${
                              i === 2 ? 'border-primary' : 'border-border'
                            } bg-background flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors`}
                          >
                            <Image className="w-6 h-6 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">Push All to Review</Button>
                      <Button size="sm" variant="secondary" className="flex-1">Push to Next</Button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Features Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Smart Detection
              </h3>
              <p className="text-xs text-muted-foreground">Auto-detects content type and renders the appropriate display mode</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Space Efficient
              </h3>
              <p className="text-xs text-muted-foreground">Collapsible dock state saves canvas space when not actively reviewing</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                Push Actions
              </h3>
              <p className="text-xs text-muted-foreground">Direct push to Kanban review or connect to next canvas node</p>
            </div>
          </div>
        </Card>

        {/* Original Mockups Grid */}
        <div className="pt-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Original Design Concepts</h2>
          <p className="text-sm text-muted-foreground mb-6">The following 5 mockups represent the original concepts that informed the hybrid design above.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Mockup 1: Compact Creative Factory */}
          <Card className="p-6 space-y-4 bg-card border-border">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">1. Compact Creative Factory</h2>
              <p className="text-sm text-muted-foreground">Minimal footprint with horizontal carousel gallery</p>
            </div>
            
            <div className="flex justify-center py-8">
              <div className="relative w-[280px] h-[200px] rounded-xl border-2 bg-card shadow-xl border-border">
                {/* Left Input Handles */}
                <div className="absolute left-0 top-8 flex flex-col gap-3 -translate-x-1/2">
                  <div className="w-3 h-3 rounded-full border-2 bg-yellow-500 border-yellow-300" title="Images" />
                  <div className="w-3 h-3 rounded-full border-2 bg-blue-500 border-blue-300" title="Copy" />
                  <div className="w-3 h-3 rounded-full border-2 bg-purple-500 border-purple-300" title="Brain Context" />
                </div>

                {/* Right Output Handles */}
                <div className="absolute right-0 top-8 flex flex-col gap-3 translate-x-1/2">
                  <div className="w-3 h-3 rounded-full border-2 bg-green-500 border-green-300" title="To Review Chat" />
                  <div className="w-3 h-3 rounded-full border-2 bg-orange-500 border-orange-300" title="Export" />
                  <div className="w-3 h-3 rounded-full border-2 bg-muted-foreground border-muted" title="Chain" />
                </div>

                {/* Content */}
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Creative Factory</span>
                    <Badge variant="secondary" className="ml-auto text-xs">6 drafts</Badge>
                  </div>
                  
                  <div className="flex-1 bg-muted/50 rounded-lg p-2 mb-2">
                    <div className="flex gap-1 h-full">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 bg-background rounded border border-border flex items-center justify-center">
                          <Image className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-1 mt-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted'}`} />
                      ))}
                    </div>
                  </div>
                  
                  <Button size="sm" className="w-full h-7 text-xs">Generate</Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Pros</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Minimal canvas space</li>
                  <li>• Quick overview</li>
                  <li>• Clean aesthetic</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Best For</h3>
                <p className="text-xs text-muted-foreground">Quick iterations with limited preview needs</p>
              </div>
            </div>
          </Card>

          {/* Mockup 2: Expanded Grid Gallery */}
          <Card className="p-6 space-y-4 bg-card border-border">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">2. Expanded Grid Gallery</h2>
              <p className="text-sm text-muted-foreground">Large node with 2×3 thumbnail grid and platform tabs</p>
            </div>
            
            <div className="flex justify-center py-8">
              <div className="relative w-[500px] h-[400px] rounded-xl border-2 bg-card shadow-xl border-primary ring-2 ring-primary/30">
                {/* Left Input Handles */}
                <div className="absolute left-0 top-12 flex flex-col gap-4 -translate-x-1/2">
                  <div className="w-3 h-3 rounded-full border-2 bg-yellow-500 border-yellow-300" title="Images" />
                  <div className="w-3 h-3 rounded-full border-2 bg-blue-500 border-blue-300" title="Headlines" />
                  <div className="w-3 h-3 rounded-full border-2 bg-pink-500 border-pink-300" title="Offers" />
                  <div className="w-3 h-3 rounded-full border-2 bg-purple-500 border-purple-300" title="Brain" />
                </div>

                {/* Right Output Handles */}
                <div className="absolute right-0 top-12 flex flex-col gap-4 translate-x-1/2">
                  <div className="w-3 h-3 rounded-full border-2 bg-green-500 border-green-300" title="Review" />
                  <div className="w-3 h-3 rounded-full border-2 bg-orange-500 border-orange-300" title="Export" />
                  <div className="w-3 h-3 rounded-full border-2 bg-muted-foreground border-muted" title="Next Node" />
                </div>

                {/* Content */}
                <div className="p-6 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <Layers className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">Creative Studio</span>
                    <div className="flex gap-1 ml-auto">
                      <Badge variant="outline" className="text-xs">FB</Badge>
                      <Badge variant="secondary" className="text-xs">IG</Badge>
                      <Badge variant="outline" className="text-xs">TT</Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-muted/50 rounded-lg p-3 mb-4 overflow-hidden">
                    <div className="grid grid-cols-3 gap-2 h-full">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-background rounded border-2 border-border flex items-center justify-center relative group hover:border-primary transition-colors">
                          <Image className="w-8 h-8 text-muted-foreground" />
                          <div className="absolute top-1 right-1 w-4 h-4 rounded border border-border bg-background opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button className="w-full">Generate 6 Creatives</Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Pros</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• See many variations</li>
                  <li>• Platform selection</li>
                  <li>• Bulk actions</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Best For</h3>
                <p className="text-xs text-muted-foreground">High-volume creative production with multi-platform needs</p>
              </div>
            </div>
          </Card>

          {/* Mockup 3: Pipeline Stage View */}
          <Card className="p-6 space-y-4 bg-card border-border">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">3. Pipeline Stage View</h2>
              <p className="text-sm text-muted-foreground">Visual pipeline with stage indicators and progress tracking</p>
            </div>
            
            <div className="flex justify-center py-8">
              <div className="relative w-[450px] h-[300px] rounded-xl border-2 bg-card shadow-xl border-border">
                {/* Left Input Handles */}
                <div className="absolute left-0 top-8 flex flex-col gap-3 -translate-x-1/2">
                  <div className="w-3 h-3 rounded-full border-2 bg-yellow-500 border-yellow-300" title="Assets" />
                  <div className="w-3 h-3 rounded-full border-2 bg-blue-500 border-blue-300" title="Copy" />
                  <div className="w-3 h-3 rounded-full border-2 bg-pink-500 border-pink-300" title="Style" />
                  <div className="w-3 h-3 rounded-full border-2 bg-purple-500 border-purple-300" title="Research" />
                </div>

                {/* Right Output Handles */}
                <div className="absolute right-0 top-8 flex flex-col gap-3 translate-x-1/2">
                  <div className="w-3 h-3 rounded-full border-2 bg-green-500 border-green-300" title="Approved" />
                  <div className="w-3 h-3 rounded-full border-2 bg-yellow-500 border-yellow-300" title="Needs Edit" />
                  <div className="w-3 h-3 rounded-full border-2 bg-blue-500 border-blue-300" title="To Queue" />
                </div>

                {/* Content */}
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <List className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Creative Pipeline</span>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    {['Collect', 'Generate', 'Preview', 'Queue'].map((stage, idx) => (
                      <div key={stage} className="bg-muted/50 rounded-lg p-2 flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-primary text-primary-foreground' : 
                          idx === 1 ? 'bg-secondary text-secondary-foreground' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-foreground">{stage}</span>
                        {idx < 2 && (
                          <div className="ml-auto flex gap-1">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="w-8 h-8 bg-background rounded border border-border flex items-center justify-center">
                                <Image className="w-4 h-4 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        )}
                        {idx === 2 && <Badge className="ml-auto" variant="secondary">5 ready</Badge>}
                        {idx === 3 && <Badge className="ml-auto" variant="outline">0 queued</Badge>}
                      </div>
                    ))}
                  </div>
                  
                  <Button size="sm" variant="secondary" className="w-full mt-2">Process Pipeline</Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Pros</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Clear workflow stages</li>
                  <li>• Progress tracking</li>
                  <li>• Status visibility</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Best For</h3>
                <p className="text-xs text-muted-foreground">Teams managing approval workflows and quality gates</p>
              </div>
            </div>
          </Card>

          {/* Mockup 4: Split Panel with Chat */}
          <Card className="p-6 space-y-4 bg-card border-border">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">4. Split Panel with Chat</h2>
              <p className="text-sm text-muted-foreground">60/40 split with gallery and built-in review chat</p>
            </div>
            
            <div className="flex justify-center py-8">
              <div className="relative w-[600px] h-[400px] rounded-xl border-2 bg-card shadow-xl border-border">
                {/* Left Input Handles */}
                <div className="absolute left-0 top-12 flex flex-col gap-4 -translate-x-1/2">
                  <div className="w-3 h-3 rounded-full border-2 bg-yellow-500 border-yellow-300" title="Media" />
                  <div className="w-3 h-3 rounded-full border-2 bg-blue-500 border-blue-300" title="Copy" />
                  <div className="w-3 h-3 rounded-full border-2 bg-purple-500 border-purple-300" title="Context" />
                </div>

                {/* Right Output Handles */}
                <div className="absolute right-0 top-12 flex flex-col gap-4 translate-x-1/2">
                  <div className="w-3 h-3 rounded-full border-2 bg-green-500 border-green-300" title="Approved" />
                  <div className="w-3 h-3 rounded-full border-2 bg-yellow-500 border-yellow-300" title="Iterate" />
                </div>

                {/* Content */}
                <div className="p-4 h-full flex">
                  {/* Left: Gallery */}
                  <div className="flex-[3] pr-3 border-r border-border flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Gallery</span>
                      <Badge variant="secondary" className="ml-auto text-xs">4/6</Badge>
                    </div>
                    
                    <div className="flex-1 bg-muted/50 rounded-lg p-2">
                      <div className="grid grid-cols-2 gap-2 h-full">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-background rounded border-2 border-primary flex items-center justify-center">
                            <Image className="w-8 h-8 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button size="sm" className="w-full mt-2">Generate More</Button>
                  </div>

                  {/* Right: Review Chat */}
                  <div className="flex-[2] pl-3 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Review</span>
                    </div>
                    
                    <div className="flex-1 bg-muted/50 rounded-lg p-2 space-y-2 overflow-hidden">
                      <div className="bg-background rounded p-2 text-xs">
                        <p className="text-muted-foreground">Make the headline punchier</p>
                      </div>
                      <div className="bg-primary/10 rounded p-2 text-xs ml-4">
                        <p className="text-foreground">Updated! Check #2</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Check className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="secondary" className="flex-1">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Pros</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Inline collaboration</li>
                  <li>• Quick feedback loop</li>
                  <li>• Context preserved</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Best For</h3>
                <p className="text-xs text-muted-foreground">Collaborative review with stakeholder feedback</p>
              </div>
            </div>
          </Card>

          {/* Mockup 5: Dock-Style Expandable */}
          <Card className="p-6 space-y-4 bg-card border-border lg:col-span-2">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">5. Dock-Style Expandable</h2>
              <p className="text-sm text-muted-foreground">Toggle between compact status bar and full gallery view</p>
            </div>
            
            <div className="flex justify-center py-8 gap-8">
              {/* Collapsed State */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground text-center">Collapsed</p>
                <div className="relative w-[250px] h-[60px] rounded-xl border-2 bg-card shadow-xl border-border">
                  {/* Left Input Indicators */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 -translate-x-1/2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" title="Connected" />
                    <div className="w-2 h-2 rounded-full bg-blue-500" title="Connected" />
                    <div className="w-2 h-2 rounded-full bg-muted" title="Not connected" />
                  </div>

                  {/* Content */}
                  <div className="p-3 h-full flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground text-sm">Creatives</span>
                    <Badge variant="secondary" className="text-xs">12 ready</Badge>
                    <Button size="sm" variant="ghost" className="ml-auto h-6 w-6 p-0" onClick={() => setExpandedDock(!expandedDock)}>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded State */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground text-center">Expanded</p>
                <div className="relative w-[450px] h-[350px] rounded-xl border-2 bg-card shadow-xl border-primary ring-2 ring-primary/30">
                  {/* Left Input Handles (full) */}
                  <div className="absolute left-0 top-12 flex flex-col gap-3 -translate-x-1/2">
                    <div className="w-3 h-3 rounded-full border-2 bg-yellow-500 border-yellow-300" title="Images" />
                    <div className="w-3 h-3 rounded-full border-2 bg-blue-500 border-blue-300" title="Copy" />
                    <div className="w-3 h-3 rounded-full border-2 bg-muted border-border" title="Context" />
                  </div>

                  {/* Content */}
                  <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-foreground">Creative Factory</span>
                      <Badge variant="secondary" className="text-xs">12 ready</Badge>
                      <Button size="sm" variant="ghost" className="ml-auto h-6 w-6 p-0">
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 bg-muted/50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-4 gap-2 h-full">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <div key={i} className="bg-background rounded border border-border flex items-center justify-center hover:border-primary transition-colors">
                            <Image className="w-6 h-6 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Push to Chat
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Link2 className="w-3 h-3 mr-1" />
                        Chain
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Pros</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Space-efficient when collapsed</li>
                  <li>• Full functionality when expanded</li>
                  <li>• Connection status at a glance</li>
                  <li>• Action buttons instead of abstract handles</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Best For</h3>
                <p className="text-xs text-muted-foreground">Complex workflows where canvas real estate is limited but full control is needed on demand</p>
              </div>
            </div>
          </Card>

        </div>

        {/* Recommendation */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="text-xl font-semibold text-foreground mb-3">💡 Recommended Approach</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Combine the best of <strong>Mockup 2 (Expanded Grid Gallery)</strong> with the collapsible behavior of <strong>Mockup 5 (Dock-Style)</strong>:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• <strong>Collapsed state:</strong> Show icon, title, badge count, and input connection status</li>
            <li>• <strong>Expanded state:</strong> Full grid gallery with platform tabs and selection controls</li>
            <li>• <strong>Smart handles:</strong> Traditional input handles (left) and output handles (right) always visible</li>
            <li>• <strong>Generate CTA:</strong> Prominent button for triggering creative generation</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default CreativeMockups;