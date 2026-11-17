import { DocumentPage, documentMetadata, documentParams, type DocumentParams } from "@/components/document-page"

export function generateStaticParams() { return documentParams("oauth") }
export function generateMetadata(props: DocumentParams) { return documentMetadata("oauth", props) }
export default function Page({ params }: DocumentParams) { return <DocumentPage service="oauth" params={params} /> }
