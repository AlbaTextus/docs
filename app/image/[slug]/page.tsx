import { DocumentPage, documentMetadata, documentParams, type DocumentParams } from "@/components/document-page"

export function generateStaticParams() { return documentParams("image") }
export function generateMetadata(props: DocumentParams) { return documentMetadata("image", props) }
export default function Page({ params }: DocumentParams) { return <DocumentPage service="image" params={params} /> }
