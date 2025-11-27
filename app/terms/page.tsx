import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function Terms() {
    return (
        <div className="w-full flex justify-center p-10">
            <div className="w-full max-w-screen-md space-y-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 underline"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Chatbot
                </Link>

                <div className="prose prose-sm prose-ol:list-decimal prose-li:marker:text-gray-800 text-gray-800 bg-white p-6 rounded-md shadow-sm max-w-none [&_ol]:ml-5 [&_li]:ml-2">
                    <h1 className="font-bold">Raul – Terms of Service (TOS)</h1>

                    <p>
                        Welcome to Raul-Real Madrid Match Companion, an AI-powered football companion designed to provide match insights, tactical explainers, historical knowledge, and summaries of publicly available discussions using external search APIs. By accessing or using Raul, you agree to the following Terms of Service. If you do not agree, you must not use the service.
                    </p>

                    <h2 className="font-bold">1. Service Description</h2>
                    <p  >Raul is an informational AI assistant that provides:</p>
                    <ol>
                        <li>1.Live and recent football match insights sourced via external web search tools (e.g., EXA).</li>
                        <li>2.Fan reaction summaries based on publicly available online discussions.</li>
                        <li>3.Tactical, historical, and club-related explanations using pre-indexed evergreen knowledge in a vector database.</li>
                        <li>4.General football concepts using LLM-based reasoning.</li>
                    </ol>
                    <p>Raul is not an official Real Madrid product, nor affiliated with any club, league, federation, or broadcaster.</p>

                    <h2 className="font-bold">2. No Real-Time Guarantees</h2>
                    <p  >Raul attempts to fetch the latest match information using external sources. However:</p>
                    <ol>
                        <li>1.Live data may be delayed, inaccurate, incomplete, or unavailable.</li>
                        <li>2.Search results and insights depend entirely on third-party content.</li>
                        <li>3.Raul does not guarantee real-time accuracy, correctness, or completeness.</li>
                    </ol>
                    <p>Use the service at your own discretion.</p>

                    <h2 className="font-bold">3. Use Restrictions</h2>
                    <p  >You agree not to use Raul:</p>
                    <ol>
                        <li>1.For gambling, betting, or financial decisions.</li>
                        <li>2.For reporting, journalism, or official match referencing.</li>
                        <li>3.To impersonate an official football authority, club, or league.</li>
                        <li>4.To generate or share harmful, offensive, or abusive content.</li>
                        <li>5.For automated scraping or reverse engineering.</li>
                    </ol>

                    <h2 className="font-bold">4. Intellectual Property</h2>
                    <ol>
                        <li>1.ll AI-generated content belongs to the respective AI providers (OpenAI, EXA) under their licensing terms.</li>
                        <li>2.Your inputs remain yours.</li>
                        <li>3.You grant Raul the right to process your inputs to provide the service.</li>
                        <li>4.Real Madrid trademarks, logos, and brand identity belong to Real Madrid CF and are referenced only for descriptive purposes.</li>
                    </ol>
                    <p>Raul does not claim ownership of any brand or trademark.</p>

                    <h2 className="font-bold">5. Data Sources and Attribution</h2>
                    <p  >Raul may use:</p>
                    <ol>
                        <li>1.External web search APIs (e.g., EXA)</li>
                        <li>2.Publicly accessible webpages</li>
                        <li>3.Evergreen documents manually inserted into a vector database</li>
                        <li>4.General football knowledge from LLM models</li>
                    </ol>
                    <p>The bot summarizes or rephrases content retrieved from these sources. Raul does not store, host, or republish third-party copyrighted content verbatim.</p>

                    <h2 className="font-bold">6. User Conduct</h2>
                    <p  >You agree not to submit:</p>
                    <ol>
                        <li>1.Personal or sensitive information</li>
                        <li>2.Offensive, discriminatory, or abusive messages</li>
                        <li>3.Malicious inputs designed to exploit or break the system</li>
                        <li>4.Requests for illegal actions</li>
                    </ol>
                    <p>If such content is submitted, the bot may refuse to respond or terminate your session.</p>

                    <h2 className="font-bold">7. Disclaimer of Accuracy and Liability</h2>
                    <p  >Raul is provided "as is" without warranties of any kind, including:</p>
                    <ol>
                        <li>1.Accuracy</li>
                        <li>2.Reliability</li>
                        <li>3.Timeliness</li>
                        <li>4.Fitness for a particular purpose</li>
                    </ol>
                    <p  >You understand and agree that:</p>
                    <ol>
                        <li>a.Raul is experimental and may produce incorrect or inconsistent outputs.</li>
                        <li>b.You use the information at your own risk.</li>
                        <li>c.The creators are not liable for decisions made based on AI responses.</li>
                    </ol>

                    <h2 className="font-bold">8. No Professional Advice</h2>
                    <p  >Raul does NOT provide:</p>
                    <ol>
                        <li>1.Betting or gambling predictions</li>
                        <li>2.Legal advice</li>
                        <li>3.Financial advice</li>
                        <li>4.Professional sports analysis for publication</li>
                    </ol>
                    <p>Raul's insights are for informational and educational purposes only.</p>

                    <h2 className="font-bold">9. Service Changes &amp; Updates</h2>
                    <p>The service may change, pause, or terminate at any time without notice. Features may be added, removed, or modified.</p>

                    <h2 className="font-bold">10. Privacy &amp; Data Handling</h2>
                    <p  >Raul may process:</p>
                    <ol>
                        <li>1.User messages</li>
                        <li>2.Metadata such as timestamps</li>
                        <li>3.Search queries sent to external APIs</li>
                    </ol>
                    <p  >Data is used only to:</p>
                    <ol>
                        <li>1.Provide responses</li>
                        <li>2.Improve system safety and performance</li>
                    </ol>
                    <p>Raul does not store personal data intentionally. Do not share sensitive information.</p>

                    <h2 className="font-bold">11. Third-Party Integrations</h2>
                    <p  >Raul uses external APIs such as:</p>
                    <ol>
                        <li>1.OpenAI</li>
                        <li>2.EXA</li>
                        <li>3.Pinecone</li>
                    </ol>
                    <p>Use of Raul implies acceptance of those providers’ terms. The creators are not responsible for outages, errors, or content generated by these APIs.</p>

                    <h2 className="font-bold">12. Limitation of Liability</h2>
                    <p  >To the maximum extent permitted by law:</p>
                    <ol>
                        <li>1.The creators are not liable for indirect, incidental, or consequential damages.</li>
                        <li>2.The service is provided without guarantees.</li>
                        <li>3.Use of Raul constitutes agreement to release the creators from claims related to the AI output.</li>
                    </ol>

                    <h2 className="font-bold">13. Governing Law</h2>
                    <p>These Terms of Service are governed by your local jurisdiction unless otherwise specified. Disputes must be resolved under applicable local laws.</p>

                    <h2 className="font-bold">14. Contact</h2>
                    <p>For questions or feedback about Raul, contact: 📩 <a className="underline" href="https://github.com/Venkat-cyber1">https://github.com/Venkat-cyber1</a></p>

                    <p className="text-sm text-gray-600">Last updated: November 27, 2025</p>
                </div>
            </div>
        </div>
    );
}