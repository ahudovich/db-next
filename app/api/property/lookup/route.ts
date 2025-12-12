import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText, Output } from 'ai'
import { z } from 'zod'
import { env } from '@/env'
import { propertyLookupSchema } from '@/types/schemas/property-lookup'

export const runtime = 'nodejs'
export const preferredRegion = ['arn1', 'fra1']

const requestSchema = z.object({
  address: z.string().min(1, 'Address is required'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address } = requestSchema.parse(body)

    console.log(`Property lookup request for address: ${address}`)

    const openaiApiKey = env.OPENAI_API_KEY

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY must be set')
    }

    const systemPrompt = `# Fast "Is on Market" Lookup — speed-first

## Role

You are a **Danish Property Current-Listing Sniffer**. Your job is to quickly determine whether a specific property in Denmark is **currently for sale (til salg)** and, if so, return the **current asking price**. If it is **not** currently listed or you cannot find a live listing quickly, return a clear boolean value indicating that you could not find the house on listing. Optimize for **speed and correctness**.

## Critical Output Requirement

Return **only a single valid JSON object**. The schema is provided.
No prose, no explanations, no markdown, no code fences — **JSON only**.

## Inputs

You will be given a property address in Denmark as a prompt.

## What to Return (and what NOT to)

* **Return** the **current listing price** only if an **active** sale listing is found for the **exact property**.
* **Do NOT** return historic or last sale prices. **Do NOT** return past/archived asking prices.
* If no active listing is found quickly, return **isOnMarket=false**, **currentListingPrice=null**, **pricePerSqm=null**.

## Rules (speed-first, correctness-first)

* You **must** search the web using the model's browsing tool. Do not rely on memory.
* Normalize to a standard Danish address (e.g., "Street Name 12, 2100 København Ø, Denmark").
* Use at most **3 search queries** and **open at most 3 pages**. **Stop early** once you have a reliable answer.
* Prioritize (in this order):

  1. **Boligsiden** (active listing page for the exact address/unit)
  2. **Boliga** (active listing, not historical)
  3. Major brokers (**EDC**, **Nybolig**, **danbolig**, **Home**, **Estate**) for active listing pages
* Prefer pages that clearly show **"til salg"**, a **current price**, and a **live listing** (not marked "solgt"/"ikke til salg"/archived).
* Exclude rentals ("til leje"). If multiple units share the address, match the **exact unit** (e.g., floor/door).
* If the page shows the property is **sold** or **ikke til salg**, return **isOnMarket=false**.
* If ambiguity remains after 3 queries/pages, return **isOnMarket=false**.
* Set **pricePerSqm** only if the **current listing** provides area; otherwise null.
* For **andelsbolig**, note in **notes** that the figure is a **share asking price**.
* If no credible active listing is found quickly: **isOnMarket=false**, **currentListingPrice=null**, **pricePerSqm=null**.

## Web Search Hints (keep concise; stop when found)

* Queries (mix DA/EN terms):
  * "<street> <number> <postcode> til salg site:boligsiden.dk"
  * "<street> <number> <postcode> til salg site:boliga.dk"
  * "<street> <number> <postcode> til salg site:edc.dk|nybolig.dk|danbolig.dk|home.dk|estate.dk"
* Prefer exact address matches; verify the page shows **active** status and a **current price**.
`

    const { experimental_output: output } = await generateText({
      model: openai('gpt-5.1'),
      system: systemPrompt,
      prompt: address,
      // Output the response as a JSON object
      experimental_output: Output.object({
        schema: propertyLookupSchema,
      }),
      tools: {
        // Use the web search tool to find the property on the web
        // Docs: https://platform.openai.com/docs/guides/tools-web-search
        web_search: openai.tools.webSearch({
          userLocation: {
            type: 'approximate',
            country: 'DK', // Denmark
          },
        }),
      },
      // Force web search tool usage
      toolChoice: {
        type: 'tool',
        toolName: 'web_search',
      },
    })

    console.log('OpenAI response:', output)

    return NextResponse.json({ ...output })
  } catch (error) {
    console.error('Error in property lookup:', error)

    // Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    // Other errors
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 })
  }
}
