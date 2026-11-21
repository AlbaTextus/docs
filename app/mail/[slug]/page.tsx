import { DocumentPage, documentMetadata, documentParams, type DocumentParams } from "@/components/document-page"

export function generateStaticParams() { return documentParams("mail") }
export function generateMetadata(props: DocumentParams) { return documentMetadata("mail", props) }
export default function Page({ params }: DocumentParams) { return <DocumentPage service="mail" params={params} /> }
