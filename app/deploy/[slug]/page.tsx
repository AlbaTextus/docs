import { DocumentPage, documentMetadata, documentParams, type DocumentParams } from "@/components/document-page"

export function generateStaticParams() { return documentParams("deploy") }
export function generateMetadata(props: DocumentParams) { return documentMetadata("deploy", props) }
export default function Page({ params }: DocumentParams) { return <DocumentPage service="deploy" params={params} /> }
