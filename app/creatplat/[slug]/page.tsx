import { DocumentPage, documentMetadata, documentParams, type DocumentParams } from "@/components/document-page"

export function generateStaticParams() { return documentParams("creatplat") }
export function generateMetadata(props: DocumentParams) { return documentMetadata("creatplat", props) }
export default function Page({ params }: DocumentParams) { return <DocumentPage service="creatplat" params={params} /> }
