from backend.insights import complete_assistant_reply


def test_assistant_reply_rejects_incomplete_answer():
    assert complete_assistant_reply({'finish_reason': 'length', 'message': {'content': 'A sentence that ends in'}}) is None
    assert complete_assistant_reply({'finish_reason': 'stop', 'message': {'content': '  Complete answer.  '}}) == 'Complete answer.'
    assert complete_assistant_reply({'finish_reason': 'stop', 'message': {'content': ''}}) is None
