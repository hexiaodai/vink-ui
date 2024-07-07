import { Col, Row, Statistic } from 'antd'

interface SummaryProps { }

const Summary: React.FC<SummaryProps> = ({ }) => {
    return (
        <Row justify="end">
            <Col span={3}>
                <Statistic
                    title="节点"
                    value={12}
                    suffix="/ 30"
                />
            </Col>
            <Col span={3}>
                <Statistic
                    title="虚拟机"
                    value={93}
                    suffix="/ 100"
                />
            </Col>
        </Row>
    )
}

export default Summary
