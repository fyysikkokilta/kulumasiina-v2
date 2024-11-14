import { Card, Image } from 'antd'
import { AttachmentState } from './adminSlice'
import { apiURL } from '../utils'
import Link from 'antd/es/typography/Link'

export const Attachment = (props: { attachment: AttachmentState }) => {
  return (
    <>
      <Card>
        {props.attachment.filename.split('.')[1] !== 'pdf' ? (
          <RenderImage id={props.attachment.id} />
        ) : (
          <>
            <Link
              href={`${apiURL}/attachment/${props.attachment.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {props.attachment.filename}
            </Link>
          </>
        )}
      </Card>
    </>
  )
}
const RenderImage = (props: { id: number }) => {
  return (
    <>
      <Image src={`${apiURL}/attachment/${props.id}`} />
    </>
  )
}
