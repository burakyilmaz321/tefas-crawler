class ResponseModel:
    def __init__(self, message=None, success=None, body=None):
        self.success = success
        self.body = body
        self.message = message
