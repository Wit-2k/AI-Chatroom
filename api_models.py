from pydantic import BaseModel, Field
from typing import List, Optional

class PersonaRequest(BaseModel):
    name: str
    role_description: str
    persona_prompt: str
    interaction_examples: str = ""
    model_name: str = ""

class StartDiscussionRequest(BaseModel):
    topic: str
    personas: List[PersonaRequest]
    max_rounds: int = Field(default=3, ge=1, le=10)

class StartDiscussionResponse(BaseModel):
    session_id: str
    message: str

class StopDiscussionRequest(BaseModel):
    session_id: str

class StopDiscussionResponse(BaseModel):
    message: str
